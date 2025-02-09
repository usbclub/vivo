"use client"
// components/LiveCount.tsx
import React, { useRef, useEffect, useState } from 'react';
import { getSocket } from './socketManager';
import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
  
interface LiveCountProps {
    hasTapped: boolean;
  }

  export const LiveCount: React.FC<LiveCountProps> = ({ hasTapped }) => {
    const [count, setCount] = useState<number>(0);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const socket = getSocket();
  
    useEffect(() => {
      // Listen for live count updates
      socket.on('liveCount', (data: { count: number }) => {
        setCount(data.count);
      });

      // Start heartbeat when the socket connects
      socket.on('connect', () => {
        console.log('Socket connected. Has tapped?', hasTapped);
      });

      return () => {
        // Cleanup listeners on unmount
        socket.off('liveCount');
        socket.off('connect');
      };
    }, []);

    useEffect(() => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      if (hasTapped) {
        heartbeatIntervalRef.current = setInterval(() => {
          setCount((prevCount) => {
            const packedPayload = JSON.parse(localStorage.getItem('verifiedData') || '{}');
            console.log('[heartbeatInterval]', packedPayload?.payload?.nullifier_hash);
            socket.emit('heartbeat', { currentCount: prevCount, nullifier_hash: packedPayload?.payload?.nullifier_hash });
            return prevCount; // Keep the same count
          });
        }, 5000);
      }

      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };
    }, [hasTapped]); // React to hasTapped changes
  
    return (
      <div style={{ zIndex: 100, padding: "5rem", color: "#9BA1AC" }}>
        <div style={{ padding: "0 0 2rem 0" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="233" height="73" viewBox="0 0 233 73" fill="none">
                <g id="vivo-logo">
                    <path id="v-2" d="M145.653 71.5114C144.632 71.5114 143.85 71.2734 143.305 70.7974C142.829 70.2534 142.421 69.6404 142.081 68.9604L122.894 21.6054C122.758 21.3334 122.69 21.0274 122.69 20.6874C122.69 20.0754 122.894 19.5644 123.302 19.1564C123.778 18.6804 124.323 18.4414 124.935 18.4414H134.835C135.719 18.4414 136.366 18.6794 136.774 19.1564C137.25 19.6324 137.556 20.0744 137.692 20.4834L150.245 54.1624L162.799 20.4834C163.003 20.0754 163.309 19.6334 163.717 19.1564C164.193 18.6804 164.84 18.4414 165.656 18.4414H175.556C176.168 18.4414 176.678 18.6794 177.087 19.1564C177.563 19.5644 177.801 20.0744 177.801 20.6874C177.801 21.0274 177.767 21.3334 177.699 21.6054L158.41 68.9604C158.138 69.6404 157.73 70.2534 157.185 70.7974C156.641 71.2734 155.859 71.5114 154.838 71.5114H145.653Z" fill="black"/>
                    <path id="v-1" d="M22.963 71.5114C21.942 71.5114 21.16 71.2734 20.615 70.7974C20.139 70.2534 19.731 69.6404 19.391 68.9604L0.204 21.6054C0.068 21.3334 0 21.0274 0 20.6874C0 20.0754 0.204 19.5644 0.612 19.1564C1.088 18.6804 1.633 18.4414 2.245 18.4414H12.145C13.029 18.4414 13.676 18.6794 14.084 19.1564C14.56 19.6324 14.866 20.0744 15.002 20.4834L27.555 54.1624L40.109 20.4834C40.313 20.0754 40.619 19.6334 41.027 19.1564C41.503 18.6804 42.15 18.4414 42.966 18.4414H52.866C53.478 18.4414 53.988 18.6794 54.397 19.1564C54.873 19.5644 55.111 20.0744 55.111 20.6874C55.111 21.0274 55.077 21.3334 55.009 21.6054L35.72 68.9604C35.448 69.6404 35.04 70.2534 34.495 70.7974C33.951 71.2734 33.169 71.5114 32.148 71.5114H22.963Z" fill="black"/>
                    <path id="o" d="M206.147 72.5319C200.5 72.5319 195.771 71.6129 191.961 69.7759C188.151 67.8709 185.225 65.1829 183.184 61.7139C181.211 58.2439 180.122 54.1959 179.918 49.5689C179.85 48.2079 179.816 46.6769 179.816 44.9759C179.816 43.2069 179.85 41.6759 179.918 40.3829C180.122 35.6879 181.279 31.6399 183.388 28.2379C185.497 24.7679 188.457 22.1139 192.267 20.2769C196.077 18.3719 200.704 17.4189 206.147 17.4189C211.522 17.4189 216.114 18.3709 219.925 20.2769C223.735 22.1139 226.694 24.7679 228.804 28.2379C230.913 31.6399 232.069 35.6879 232.274 40.3829C232.41 41.6759 232.478 43.2069 232.478 44.9759C232.478 46.6769 232.41 48.2079 232.274 49.5689C232.069 54.1959 230.947 58.2439 228.906 61.7139C226.933 65.1839 224.041 67.8709 220.231 69.7759C216.421 71.6129 211.726 72.5319 206.147 72.5319ZM206.147 61.3059C209.481 61.3059 211.998 60.2849 213.699 58.2439C215.4 56.1349 216.319 53.0729 216.455 49.0589C216.523 48.0379 216.557 46.6779 216.557 44.9769C216.557 43.2759 216.523 41.9149 216.455 40.8949C216.319 36.9489 215.4 33.9209 213.699 31.8119C211.998 29.7029 209.481 28.6479 206.147 28.6479C202.813 28.6479 200.261 29.7029 198.492 31.8119C196.791 33.9209 195.873 36.9489 195.737 40.8949C195.669 41.9159 195.635 43.2759 195.635 44.9769C195.635 46.6779 195.669 48.0389 195.737 49.0589C195.873 53.0729 196.791 56.1349 198.492 58.2439C200.261 60.2849 202.813 61.3059 206.147 61.3059Z" fill="black"/>
                    <path id="i" d="M88.887 36.012C86.246 36.012 83.774 35.304 81.633 34.082V69.253C81.633 70.52 82.66 71.547 83.927 71.547H93.842C95.109 71.547 96.136 70.52 96.136 69.253V34.086C93.997 35.306 91.527 36.013 88.888 36.013L88.887 36.012Z" fill="black"/>
                    <path id="circle" d="M88.887 32.2586C94.9141 32.2586 99.8 27.3727 99.8 21.3456C99.8 15.3185 94.9141 10.4326 88.887 10.4326C82.8599 10.4326 77.974 15.3185 77.974 21.3456C77.974 27.3727 82.8599 32.2586 88.887 32.2586Z" fill="#EE4B4B"/>
                    <path id="arrow-left-1" d="M76.59 33.6431C73.443 30.4961 71.496 26.1481 71.496 21.3461C71.496 16.5801 73.413 12.2621 76.518 9.12109" stroke="#EE4B4B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    <path id="arrow-right-1" d="M101.182 9.04785C104.33 12.1949 106.277 16.5439 106.277 21.3469C106.277 26.1499 104.33 30.4969 101.183 33.6439" stroke="#EE4B4B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    <path id="arrow-left-2" d="M69.542 40.6909C64.591 35.7399 61.529 28.9009 61.529 21.3459C61.529 13.7909 64.591 6.95293 69.54 2.00293" stroke="#EE4B4B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    <path id="arrow-right-2" d="M108.23 2C113.182 6.951 116.244 13.791 116.244 21.346C116.244 28.901 113.182 35.74 108.231 40.691" stroke="#EE4B4B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
            </svg>
        </div>
        <div style={{ textAlign: "center", paddingBottom: "0.25rem" }}>
          <img src="/people-icon.png" alt="People Icon" width="20" height="20" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #F3F4F5" }}>
          <span><Typography level={2} variant="body">Human's Here</Typography></span>
          <span><Typography level={2} variant="body">{count}</Typography></span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #F3F4F5" }}>
          <span><Typography level={2} variant="body">Unique Human Visits</Typography></span>
          <span><Typography level={2} variant="body">0002</Typography></span>
        </div>
      </div>
    );
};

  