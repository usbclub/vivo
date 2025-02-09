// server.js
const express = require('express');
const next = require('next');
const http = require('http');
const { Server: SocketIO } = require('socket.io');
const Redis = require('ioredis');
const { verifyCloudProof } = require("@worldcoin/minikit-js");
require('dotenv').config();
const Player = require('./Player');
const { PassThrough }  = require('stream');

const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();


app.prepare().then(async () => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = new SocketIO(httpServer);

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  console.log('Connecting to redis: ', redisUrl)
  const redis = new Redis(redisUrl);
  const SESSION_TTL = 10; // seconds

  const player = new Player(redis);
  await player.initialize();

  redis.on('error', (err) => {
    console.error("Redis connection error:", err);
  });

  async function checkTrackProgress() {
    const track = await player.getCurrentTrack();
    const elapsedTime = (Date.now() - track.trackStartTime) / 1000;
    const trackDuration = track.duration;
  
    if (elapsedTime > trackDuration - 10) { // Switch track when 10 sec left
      const nextTrack = await player.switchToNextTrack();
      console.log(`[Server] Switching to next track: ${nextTrack}`);
  
      io.emit("trackUpdate", nextTrack);
    }
  }
  
  // Check track progress every 5 seconds
  setInterval(checkTrackProgress, 5000);
  
  // Custom API routes or middleware can be added here.
  // For instance, handling Socket.IO events:
  io.on('connection', async (socket) => {
    console.log('a client connected');
    // checkForAuthAndUpdate()
    
    // TODO: Swap this out to use full payload to re-verify and check if 
    // already verified within last 24 hours
    async function checkForAuthAndUpdate(nullifier_hash){
        await redis.set(`session:${nullifier_hash}`, Date.now(), 'EX', SESSION_TTL);
        await redis.expire(`coords:${nullifier_hash}`, SESSION_TTL);
    }

    let count = await getCurrentLiveCount();
    socket.emit('liveCount', { count });

    socket.on('heartbeat', async (data) => {
        console.log('heartbeat: ', data)
        let count = await getCurrentLiveCount();
        let coords = await getCurrentLiveCoords();
        if(data != undefined && data.hasOwnProperty("currentCount") && data.currentCount != count){
            console.log('heartbeat - counts not the same')
            socket.emit('liveCount', { count });
            socket.emit('liveCoords', { coords });
        }
        checkForAuthAndUpdate(data.nullifier_hash)
    })

    socket.on("requestTrack", async () => {
        const track = await player.getCurrentTrack();
        socket.emit("trackUpdate", track);
    });

    socket.on("requestNextTrack", async () => {
        console.log("[Socket] Client requested next track");
        const nextTrack = await player.switchToNextTrack();
        io.emit("trackUpdate", nextTrack); // Notify all clients of the track change
    });

    // 
    // Verify proof and update redis 
    socket.on('verified', async (data) => {
        console.log("verified socket", data)
      try {
        const { payload, action, signal } = data;
        const app_id = process.env.APP_ID;
        const verifyRes = await verifyProof(payload, app_id, action, signal);

        if (verifyRes.success) {
          const { nullifier_hash } = payload;
          socket.data.nullifier_hash = nullifier_hash;
        
          const track = await player.getCurrentTrack();
          socket.emit("startListening", track);
          console.log('Sent listening info.', track);

        } else {
          console.log('Verification failed');
          socket.emit('verificationFailed', { message: 'User not verified.' });
        }
      } catch (error) {
        console.error('Error during verification:', error);
        socket.emit('verificationError', { message: 'An error occurred during verification' });
      }
    });

    // 
    // Verify proof and update redis 
    socket.on('tap', async (data) => {
        console.log("human tapped", data.nullifier_hash)
      try {
        const { tapXPercent, tapYPercent, nullifier_hash } = data;
        
        await redis.set(`session:${nullifier_hash}`, Date.now(), 'EX', SESSION_TTL);
        await redis.set(`coords:${nullifier_hash}`, JSON.stringify({ x: tapXPercent, y: tapYPercent }), 'EX', SESSION_TTL);
        broadcastListeners()

      } catch (error) {
        console.error('Error during tap save:', error);
        socket.emit('tapError', { message: 'An error occurred while saving a tap.' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        console.log('a client disconnected', socket.data.nullifier_hash);

        const nh = socket.data.nullifier_hash
        if (nh) {
            console.log(`Socket ${socket.id} for user ${nh} disconnected`);
            // Remove the user’s session or mark it as inactive.
            await redis.del(`session:${nh}`);
            await redis.del(`coords:${nh}`);
        }

        broadcastListeners();
    });

    // Emit events or listen for messages as needed.
  });

  async function broadcastListeners(){
    console.log('broadcastListeners')
    let count = await getCurrentLiveCount();
    let coords = await getCurrentLiveCoords();
    console.log('coords: ', coords)
    io.emit('liveCount', { count });
    io.emit('liveCoords', { coords });
  }

  async function getCurrentLiveCount(){
    const sessionKeys = await redis.keys('session:*');
    console.log('sessionKeys', sessionKeys)
    console.log("get current live count: ", sessionKeys.length)
    return sessionKeys.length;
  }

async function getCurrentLiveCoords() {
  const coordKeys = await redis.keys('coords:*');
  console.log('coordKeys', coordKeys)
  const coords = [];

  for (const key of coordKeys) {
    const coordData = await redis.get(key);
    if (coordData) {
      coords.push(JSON.parse(coordData));
    }
  }

  console.log('returning coords', coords)

  return coords;
}


//
// HLS
// 

// Serve static HLS files dynamically based on track name
server.get('/hls/:trackName/output.m3u8', (req, res) => {
    const { trackName } = req.params;
    const filePath = path.join(__dirname, 'public', 'audio', trackName, 'output.m3u8');

    console.log(`[proxy-hls] Serving HLS for track: ${trackName}`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`[proxy-hls] Error serving ${trackName}:`, err);
            res.status(404).send('HLS file not found');
        }
    });
});

// Serve .ts segment files dynamically
server.get('/hls/:trackName/:segment', (req, res) => {
    const { trackName, segment } = req.params;
    const filePath = path.join(__dirname, 'public', 'audio', trackName, segment);

    console.log(`[proxy-hls] Serving segment: ${trackName}/${segment}`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`[proxy-hls] Error serving segment ${segment}:`, err);
            res.status(404).send('Segment file not found');
        }
    });
});



//
// PROXY 
// 
  server.get('/proxy-audio', async (req, res) => {
    console.log('[proxy-audio] call with', req.query.url);
    const audioUrl = req.query.url;

    try {
        const response = await fetch(audioUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Set headers
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', response.headers.get('content-type'));
        res.set('Content-Length', response.headers.get('content-length'));

        // Stream response using PassThrough
        const passthrough = new PassThrough();
        response.body.pipeTo(new WritableStream({
            write(chunk) {
                passthrough.write(chunk);
            },
            close() {
                passthrough.end();
            }
        }));
        passthrough.pipe(res);
    } catch (err) {
        console.error('[proxy-audio] error', err);
        res.status(500).send('Error fetching audio');
    }
});


//   server.get('/stream2', (req, res) => {
//     // Adjust the path to where your file is located.
//     const filePath = path.resolve(__dirname, './public/audio/lilypad.mp3');
    
//     // Check if the file exists and get its stats.
//     fs.stat(filePath, (err, stats) => {
//       if (err) {
//         console.error("File not found:", err);
//         return res.status(404).send("File not found");
//       }
  
//       const fileSize = stats.size;
//       const range = req.headers.range;
  
//       if (range) {
//         // Parse the Range header (e.g., "bytes=12345-")
//         const parts = range.replace(/bytes=/, "").split("-");
//         const start = parseInt(parts[0], 10);
//         const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
//         const chunkSize = end - start + 1;
  
//         // Set headers for partial content.
//         res.writeHead(206, {
//           "Content-Range": `bytes ${start}-${end}/${fileSize}`,
//           "Accept-Ranges": "bytes",
//           "Content-Length": chunkSize,
//           "Content-Type": "audio/mpeg"
//         });
  
//         // Create a read stream for the requested range and pipe it to the response.
//         const fileStream = fs.createReadStream(filePath, { start, end });
//         fileStream.pipe(res);
//       } else {
//         // No Range header, so send the entire file.
//         res.writeHead(200, {
//           "Content-Length": fileSize,
//           "Content-Type": "audio/mpeg"
//         });
//         fs.createReadStream(filePath).pipe(res);
//       }
//     });
//   });

  // Handle all Next.js pages
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`> Server listening on http://localhost:${port}`);
  });
});

async function verifyProof(payload, app_id, action, signal) {
    const verifyRes = await verifyCloudProof(payload, app_id, action, signal);
    console.log("verifyRes:", verifyRes);
    console.log("payload:", payload);
    return verifyRes;
}