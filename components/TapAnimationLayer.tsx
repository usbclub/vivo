"use client"
import React, { useEffect, useState } from 'react';
import { useSpring, animated } from "@react-spring/web";
import { getSocket } from './socketManager';

interface Dot {
    id: string;
    x: number;
    y: number;
    reanimate?: boolean;
  }

type TapCoordinates = {
    tapXPercent: number;
    tapYPercent: number;
};

interface TapAnimationLayerProps {
    onBackgroundTap: (e: MouseEvent) => void;
    tapCoordinates: TapCoordinates | null;
  }

export default function TapAnimationLayer({ onBackgroundTap, tapCoordinates }: TapAnimationLayerProps) {

    const [dots, setDots] = useState<Dot[]>([]);
    const socket = getSocket();
  
    // Handle incoming socket data
    useEffect(() => {
      socket.on("liveCoords", (data: { coords: Array<{ x: number; y: number }> }) => {
        const newDots = data.coords.map(({ x, y }) => ({
          id: `${x}-${y}`,
          x,
          y,
        }));
  
        setDots(newDots);
      });
  
      return () => {
        socket.off("liveCoords");
      };
    }, []);

    useEffect(() => {
        if (tapCoordinates) {
          const { tapXPercent, tapYPercent } = tapCoordinates;
          const newDot = {
            id: `${tapXPercent}-${tapYPercent}`,
            x: tapXPercent,
            y: tapYPercent,
          };
          setDots((prevDots) => [...prevDots, newDot]);
        }
      }, [tapCoordinates]);
  
    // Function to re-trigger a specific dot
    const reanimateDot = (id: string) => {
      setDots((prev) =>
        prev.map((dot) =>
          dot.id === id ? { ...dot, reanimate: true } : dot
        )
      );
  
      setTimeout(() => {
        setDots((prev) =>
          prev.map((dot) =>
            dot.id === id ? { ...dot, reanimate: false } : dot
          )
        );
      }, 1000);
    };
  
    return (
      <div className="absolute inset-0 w-full h-full z-index-0" onClick={onBackgroundTap}>
        {dots.map(({ id, x, y, reanimate }) => (
          <TapDot key={id} x={x} y={y} reanimate={reanimate} onClick={() => reanimateDot(id)} />
        ))}
      </div>
    );
  }
  
  // TapDot component for each animated dot
  function TapDot({ x, y, reanimate, onClick }: { x: number; y: number; reanimate?: boolean; onClick: () => void }) {
    // Spring animation states
    const { scale, opacity } = useSpring({
      from: { scale: reanimate ? 1.5 : 1.2, opacity: 0 },
      to: { scale: reanimate ? 1 : 0.9, opacity: 1 },
      config: { tension: 200, friction: 15 },
      reset: true,
    });
  
    const coreColor = useSpring({
      from: { backgroundColor: "#40DBED" },
      to: { backgroundColor: "#657080" },
      config: { duration: 2500 },
    });
  
    const outerCircle = useSpring({
      from: { scale: 2.0, opacity: 1.0 },
      to: { scale: 1.0, opacity: 0.8 },
      config: { duration: 3000 },
    });
  
    return (
      <animated.div
        className="absolute"
        onClick={onClick}
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(-50%, -50%)",
          position: "absolute",
          opacity,
          scale,
        }}
      >
        {/* Outer Circle */}
        <animated.div
          className="absolute w-20 h-20 rounded-full"
          style={{
            transform: "translate(-50%, -50%)",
            ...outerCircle,
            background: "#F3F4F5"
          }}
        />
  
        {/* Core Dot */}
        <animated.div
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{
            transform: "translate(-50%, -50%)",
            ...coreColor,
          }}
        />
      </animated.div>
    );
  }