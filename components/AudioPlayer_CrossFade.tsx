import React, { useEffect, useState, useRef } from "react";
import Hls from "hls.js";
import { getSocket } from "./socketManager.ts";

interface Track {
  fileUrl: string;
  trackStartTime: number;
}

const AudioPlayerCrossFade: React.FC = () => {
  const [track, setTrack] = useState<Track | null>(null);
  const [nextTrack, setNextTrack] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeDuration = 5; // Crossfade duration in seconds

  useEffect(() => {
    const socket = getSocket();

    socket.on("trackUpdate", (data: Track) => {
      console.log("Track Update: ", data);
      setNextTrack(data);
    });

    socket.emit("requestTrack"); // Request current track on load

    return () => {
      socket.off("trackUpdate");
    };
  }, []);

  useEffect(() => {
    if (track && audioRef.current) {
      playTrack(audioRef.current, track);
    }
  }, [track]);

  useEffect(() => {
    if (nextTrack && nextAudioRef.current) {
      prepareNextTrack(nextAudioRef.current, nextTrack);
    }
  }, [nextTrack]);

  const playTrack = (audioElement: HTMLAudioElement, track: Track) => {
    const fileUrl = `/hls/${track.fileUrl}/output.m3u8`;
    console.log(`Playing track ${fileUrl}`);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(fileUrl);
      hls.attachMedia(audioElement);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audioElement.play();
      });
    } else {
      audioElement.src = fileUrl;
      audioElement.load();
      audioElement.play();
    }

    audioElement.volume = 1.0;
    audioElement.ontimeupdate = () => {
      if (audioElement.duration - audioElement.currentTime < fadeDuration) {
        if (nextTrack) startCrossfade();
      }
    };
  };

  const prepareNextTrack = (audioElement: HTMLAudioElement, track: Track) => {
    const fileUrl = `/hls/${track.fileUrl}/output.m3u8`;
    console.log(`Preloading next track ${fileUrl}`);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(fileUrl);
      hls.attachMedia(audioElement);
    } else {
      audioElement.src = fileUrl;
      audioElement.load();
    }

    audioElement.volume = 0;
  };

  const startCrossfade = () => {
    if (!audioRef.current || !nextAudioRef.current) return;

    console.log("[Crossfade] Transitioning to next track...");
    const fadeInterval = 50;
    let fadeTime = 0;

    const fadeEffect = setInterval(() => {
      fadeTime += fadeInterval / 1000;
      audioRef.current!.volume = Math.max(0, 1 - fadeTime / fadeDuration);
      nextAudioRef.current!.volume = Math.min(1, fadeTime / fadeDuration);

      if (fadeTime >= fadeDuration) {
        clearInterval(fadeEffect);
        setTrack(nextTrack);
        setNextTrack(null);
      }
    }, fadeInterval);
  };

  return (
    <div>
      <button className="bg-blue-500 p-4" onClick={() => audioRef.current?.play()}>
        Play
      </button>
      <p>Now Playing: {track?.fileUrl}</p>
      <p>Next Up: {nextTrack?.fileUrl}</p>

      <audio ref={audioRef} />
      <audio ref={nextAudioRef} />
    </div>
  );
};

export default AudioPlayer;
