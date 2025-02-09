// components/AudioPlayer.tsx
import React, { useEffect, useState, useRef } from "react";
import { getSocket } from "./socketManager.ts";

interface Track {
  fileUrl: string;
  trackStartTime: number;
}

const AudioPlayerOld: React.FC = () => {
  const [track, setTrack] = useState<Track | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isAudioEnabledRef = useRef(false);
  const contextOffsetRef = useRef(0);

  useEffect(() => {
    const socket = getSocket();

    socket.on("startListening", (data: { track: Track }) => {
      console.log("startListening: ", data)
      setTrack(data.track);
    });

    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    contextOffsetRef.current = Date.now() / 1000 - audioContextRef.current.currentTime;

    return () => {
      socket.off("startListening");
    };
  }, []);

  const enableAudio = async () => {
    if (audioContextRef.current?.state !== "running") {
      console.log('[enableAudio] resuming...')
      await audioContextRef.current?.resume();
    }
    isAudioEnabledRef.current = true;
  };

  const playTrack = async (track: Track) => {
    console.log(`[playTrack] AudioContext state: ${audioContextRef.current?.state}`);
    if (!isAudioEnabledRef.current) {
      await enableAudio();
    }

    const trackStartAudioTime = track.trackStartTime / 1000 - contextOffsetRef.current;
    let playbackOffset = audioContextRef.current!.currentTime - trackStartAudioTime;

    if (playbackOffset < 0) {
      playbackOffset = 0;
    }

    let fileUrl = `/proxy-audio?url=${track.fileUrl}`
    // let fileUrl = track.fileUrl

    console.log(`Scheduling playback of ${fileUrl} at offset ${playbackOffset.toFixed(2)} seconds`);

    const buffer = await fetchAudioBuffer(fileUrl);
    if (!buffer) {
        console.error("Failed to decode audio buffer");
        return;
      }
    const source = audioContextRef.current!.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current!.destination);

    if (audioContextRef.current!.currentTime < trackStartAudioTime) {
      source.start(trackStartAudioTime, 0);
      console.log(`Scheduled to start at ${trackStartAudioTime.toFixed(2)} (AudioContext time)`);
    } else {
      playbackOffset = 0
      source.start(audioContextRef.current!.currentTime, playbackOffset);
      console.log(`Starting immediately at offset ${playbackOffset.toFixed(2)} seconds`);
    }
  };

  const fetchAudioBuffer = async (url: string) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContextRef.current!.decodeAudioData(arrayBuffer);
  };

  useEffect(() => {
    if (track) {
      playTrack(track);
    }
  }, [track]);

  return (
    <div>
      <div>
        <button className="bg-blue-500 p-4" onClick={enableAudio}>
          Enable Audio and Start Playing
        </button>
        <p>Now Playing: {track?.fileUrl}</p>
        {/* <p>Track Duration: {audioContextRef.current?. ? `${(audioContextRef.current.duration / 60).toFixed(2)} minutes` : "Loading..."}</p> */}
        <p>Current Time: {audioContextRef.current ? `${(audioContextRef.current.currentTime / 60).toFixed(2)} minutes` : "Loading..."}</p>
      </div>
      {/* No need for an additional button since audio is enabled automatically */}
    </div>
  );
};

export default AudioPlayer;