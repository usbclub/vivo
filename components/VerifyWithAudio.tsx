"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  MiniKit,
  VerificationLevel,
  ISuccessResult,
  MiniAppVerifyActionErrorPayload,
  IVerifyResponse,
} from "@worldcoin/minikit-js";
import { getSocket } from "./socketManager.ts"; // Import the socket manager
import AudioPlayer from "./AudioPlayer"
import TapAnimationLayer from "./TapAnimationLayer";
import { LiveCount } from "./LiveCount";
import { Typography } from "@worldcoin/mini-apps-ui-kit-react";

type TapCoordinates = {
  tapXPercent: number;
  tapYPercent: number;
};

export const VerifyWithAudio: React.FC = () => {
  const [handleVerifyResponse, setHandleVerifyResponse] = useState<
    MiniAppVerifyActionErrorPayload | IVerifyResponse | null
  >(null);
  const [isVerified, setIsVerified] = useState(false);
  const [hasTapped, setHasTapped] = useState(false);
  const [nullifierHash, setNullifierHash] = useState("");
  const [tapCoordinates, setTapCoordinates] = useState<TapCoordinates | null>(null);
  const [audio] = useState(() => {
    const audio = new Audio('/audio/vivo3.wav');
    audio.volume = 1.0; // Set volume to maximum
    return audio;
  });

  useEffect(() => {
    console.log("pre-loading audio snippet")
    audio.load(); // Pre-load the audio when the component mounts
  }, [audio]);

  const socket = getSocket();

  const verifyPayload = {
    action: "verify",
    signal: "",
    verification_level: VerificationLevel.Device,
  };

  const handleVerify = useCallback(async () => {
    if (!MiniKit.isInstalled()) {
      console.warn("Tried to invoke 'verify', but MiniKit is not installed.");
      return null;
    }

    const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

    console.log("[verify] finalPayload", finalPayload);

    if (finalPayload.status === "error") {
      console.log("Command error");
      console.log(finalPayload);
      setHandleVerifyResponse(finalPayload);
      return finalPayload;
    }

    const packedPayload = {
        payload: finalPayload as ISuccessResult,
        action: verifyPayload.action,
        signal: verifyPayload.signal,
    };
    const verifyResponse = await fetch(`/api/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(packedPayload),
    });

    const verifyResponseJson = await verifyResponse.json();

    if (verifyResponseJson.status === 200) {
      console.log("Verification success!");
      console.log(finalPayload);

      localStorage.setItem('verifiedData', JSON.stringify(packedPayload));
      socket.auth = { nullifier_hash: packedPayload.payload.nullifier_hash || "" };
      setNullifierHash(packedPayload.payload.nullifier_hash || "");
      //{ tapXPercent, tapYPercent }: TapCoordinates

      socket.emit("verified", { ...packedPayload });

      setIsVerified(true);
    }

    setHandleVerifyResponse(verifyResponseJson);
    return verifyResponseJson;
  }, []);

  const updateTapCoordinates = (tapXPercent: number, tapYPercent: number) => {
    return new Promise<void>((resolve) => {
      setTapCoordinates({ tapXPercent, tapYPercent });
      resolve();
    });
  };

  
  useEffect(() => {
    console.log('Checking if verified', isVerified);
    if (!isVerified) {
      handleVerify();
    }
  }, []); // Empty dependency array ensures this runs only on component mount


  // Define the event handler above
  const handleBackgroundTap = async (e: MouseEvent) => {
    console.log('handleBackgroundTap', e)
    if (!hasTapped && isVerified) {
      const tapXPercent = (e.clientX / window.innerWidth) * 100;
      const tapYPercent = (e.clientY / window.innerHeight) * 100;
      console.log(`Tap location: ${tapXPercent}%, ${tapYPercent}%`);

      socket.emit('tap', { tapXPercent, tapYPercent, nullifier_hash: nullifierHash });
      
      await updateTapCoordinates(tapXPercent, tapYPercent);

      audio.play().catch(error => console.error('Error playing audio:', error));
      
      setTimeout(() => {
        setHasTapped(true)
      }, 2000)
    }
  };

  return (
    <div>
        <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: 0, background: "#ffffff" }}>
            <TapAnimationLayer onBackgroundTap={handleBackgroundTap} tapCoordinates={tapCoordinates} />
        </div>

        {/* {isVerified && !hasTapped && <div style={{ textAlign: "center", paddingTop: "50vh", position: "absolute", width: "100%", height: "100%", zIndex: 10, pointerEvents: "none" }}>
            <Typography level={2} variant="body">Tap In</Typography>
        </div>} */}
        <div
          style={{
            textAlign: "center",
            paddingTop: "50vh",
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: 10,
            pointerEvents: "none",
            opacity: isVerified && !hasTapped ? 1 : 0, // Set opacity based on state
            transition: "opacity 0.5s ease-in-out", // Add transition for opacity
          }}
        >
          <span style={{fontWeight: "600" }}><Typography level={2} variant="body">Tap In</Typography></span>
        </div>

        <div style={{ position: "relative", zIndex: 10, pointerEvents: "none" }}>

            {handleVerifyResponse && 'status' in handleVerifyResponse && handleVerifyResponse.status === "error" && (
                <button onClick={handleVerify} style={{ pointerEvents: "auto" }}>Re-try Verify</button>
            )}

            <LiveCount hasTapped={hasTapped} />

            <AudioPlayer hasTapped={hasTapped} />
        </div>
    </div>
  );
};