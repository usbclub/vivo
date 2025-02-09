import React, { useEffect, useState, useRef } from "react";
import Hls from "hls.js";
import { getSocket } from "./socketManager.ts";
import AudioVisualizer from "./AudioVisualizer"; // Import the visualizer component

interface Track {
  fileUrl: string;
  trackStartTime: number;
}

interface AudioPlayerProps {
    hasTapped: boolean;
  }

const AudioPlayer: React.FC<AudioPlayerProps> = ({ hasTapped }) => {
  const [track, setTrack] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isAudioEnabledRef = useRef(false);
  const contextOffsetRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const [volume, setVolume] = useState(0);
  const [lowFreq, setLowFreq] = useState(0);
  const [midFreq, setMidFreq] = useState(0);
  const [highFreq, setHighFreq] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    socket.on("startListening", (data: Track) => {
      console.log("startListening: ", data);
      setTrack(data);
    });

    socket.on("trackUpdate", (data: Track) => {
      console.log("trackUpdate: ", data);
      setTrack(data);
    });

    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    contextOffsetRef.current = Date.now() / 1000 - audioContextRef.current.currentTime;

    return () => {
      socket.off("startListening");
      socket.off("trackUpdate");
    };
  }, []);

  const enableAudio = async () => {
    if (audioContextRef.current?.state !== "running") {
      console.log("[enableAudio] resuming...");
      await audioContextRef.current?.resume();
    }
    isAudioEnabledRef.current = true;
  };

  const setupAudioAnalysis = () => {
    if (!audioRef.current || !audioContextRef.current) return;
  
    // Check if an existing source node is already attached
    if (!analyserRef.current) {
      console.log("[setupAudioAnalysis] Creating new MediaElementSourceNode");
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
  
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    } else {
      console.warn("[setupAudioAnalysis] Skipping setup, MediaElementSourceNode already exists");
    }
  
    const updateVisualization = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
  
      const total = dataArrayRef.current.reduce((acc, val) => acc + val, 0);
      setVolume(total / dataArrayRef.current.length);
  
      const low = dataArrayRef.current.slice(0, 32).reduce((acc, val) => acc + val, 0) / 32;
      const mid = dataArrayRef.current.slice(32, 96).reduce((acc, val) => acc + val, 0) / 64;
      const high = dataArrayRef.current.slice(96).reduce((acc, val) => acc + val, 0) / 96;
  
      setLowFreq(low);
      setMidFreq(mid);
      setHighFreq(high);
  
      requestAnimationFrame(updateVisualization);
    };
  
    updateVisualization();
  };

  const playTrack = async (track: Track) => {
    console.log(`[playTrack] AudioContext state: ${audioContextRef.current?.state}`);
    if (!isAudioEnabledRef.current) {
      await enableAudio();
    }

    if (!audioRef.current) return;

    const trackStartAudioTime = track.trackStartTime / 1000 - contextOffsetRef.current;
    let playbackOffset = audioContextRef.current!.currentTime - trackStartAudioTime;

    if (playbackOffset < 0) {
      playbackOffset = 0;
    }

    let fileUrl = `/hls/${track.fileUrl}/output.m3u8`;

    console.log(`Loading HLS track ${fileUrl} with offset ${playbackOffset.toFixed(2)} seconds`);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(fileUrl);
      hls.attachMedia(audioRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audioRef.current!.play();
        setupAudioAnalysis();
        console.log(`HLS playback started at ${playbackOffset.toFixed(2)} seconds`);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error:", data);
      });
    } else if (audioRef.current.canPlayType("application/x-mpegURL")) {
      audioRef.current.src = fileUrl;
      audioRef.current.load();
      audioRef.current.play();
      setupAudioAnalysis();
    }

    audioRef.current.currentTime = playbackOffset;
  };

  useEffect(() => {
    if (track && hasTapped) {
      playTrack(track);
    }
  }, [track, hasTapped]);

//   useEffect(() => {
//     if (track) {
//       playTrack(track);
//     }
//   }, [track]);

//   useEffect(() => {
//     enableAudio()
//   }, [])

  const handleTrackEnd = () => {
    console.log("[Audio] Track ended, requesting next track...");
    const socket = getSocket();
    socket.emit("requestNextTrack");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* <AudioVisualizer volume={volume} lowFreq={lowFreq} midFreq={midFreq} highFreq={highFreq} /> */}

      {/* Gradient Visualizer */}
      <div className="absolute inset-0 flex flex-col items-center justify-end">
        <div
          className="absolute bottom-0 w-full bg-gradient-to-t from-red-500 to-transparent transition-all" 
          style={{ height: `${Math.min(volume, 100)}%` }}
        />
        <div
          className="absolute bottom-0 w-full bg-gradient-to-t from-yellow-500 to-transparent transition-all"
          style={{ height: `${Math.min(lowFreq, 100)}%` }}
        />
        <div
          className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-transparent transition-all"
          style={{ height: `${Math.min(midFreq, 100)}%` }}
        />
        <div
          className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-transparent transition-all"
          style={{ height: `${Math.min(highFreq, 100)}%` }}
        />
      </div>


      {/* Audio Controls */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* <button className="bg-blue-500 p-4 text-white rounded-md" onClick={enableAudio}>
          Enable Audio and Start Playing
        </button> */}
      </div>

      <audio ref={audioRef} controls onEnded={handleTrackEnd} className="absolute bottom-4 left-4" hidden/>
    </div>
  );
};

export default AudioPlayer;
