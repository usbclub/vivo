import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

// v2 to use fetch 
export async function GET(req: NextRequest) {
    // Construct the URL to the public file. Since the file is in the public folder,
    // it’s available at /audio/lilypad.mp3 relative to the domain.
    const audioUrl = new URL('/audio/lilypad.mp3', req.url);
    
    // Fetch the asset. This uses Next.js’ internal fetch which should work in most environments.
    const assetResponse = await fetch(audioUrl);
    
    // Optionally, you can add extra logic here (like verifying a token or logging access)
    
    // Return the asset's body directly as a streaming response.
    return new NextResponse(assetResponse.body, {
      status: assetResponse.status,
      headers: assetResponse.headers,
    });
  }


//
// v1 to use file system 

// export async function GET(req: NextRequest) {
//   // Adjust the path to your audio file as needed.
// //   const filePath = path.resolve(process.cwd(), "./lilypad.mp3");
// //   const filePath = path.resolve(__dirname, "../../audio/lilypad.mp3");
//   const filePath = path.resolve(__dirname, "./lilypad.mp3");
//   const stat = await fs.promises.stat(filePath);
//   const fileSize = stat.size;
  
//   // Read the Range header from the incoming request.
//   const rangeHeader = req.headers.get("range");

//   if (rangeHeader) {
//     // Parse the Range header (e.g., "bytes=12345-")
//     const parts = rangeHeader.replace(/bytes=/, "").split("-");
//     const start = parseInt(parts[0], 10);
//     const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
//     const chunkSize = end - start + 1;

//     // Set the appropriate headers for a partial content response.
//     const headers = new Headers({
//       "Content-Range": `bytes ${start}-${end}/${fileSize}`,
//       "Accept-Ranges": "bytes",
//       "Content-Length": chunkSize.toString(),
//       "Content-Type": "audio/mpeg",
//     });

//     // Create a Node.js stream for the requested range.
//     const fileStream = fs.createReadStream(filePath, { start, end });
//     // Convert the Node stream to a Web ReadableStream.
//     const webStream = Readable.toWeb(fileStream);

//     return new NextResponse(webStream, {
//       status: 206,
//       headers,
//     });
//   } else {
//     // No Range header provided; stream the entire file.
//     const headers = new Headers({
//       "Content-Length": fileSize.toString(),
//       "Content-Type": "audio/mpeg",
//     });

//     const fileStream = fs.createReadStream(filePath);
//     const webStream = Readable.toWeb(fileStream);

//     return new NextResponse(webStream, {
//       status: 200,
//       headers,
//     });
//   }
// }
