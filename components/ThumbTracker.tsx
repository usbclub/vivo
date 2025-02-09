//  "use client";
// import React, { useEffect, useState } from "react";
// import Gun from "gun";
// import { v4 as uuidv4 } from "uuid";
// import throttle from "lodash/throttle";

// const gun = Gun(['https://vivo-relay-01-c854a2f5cccb.herokuapp.com/']);
// const userId = uuidv4(); // Generate a unique ID for each user

// export const ThumbTracker = () => {
//   const [thumbPosition, setThumbPosition] = useState({ x: 0, y: 0 });
//   const [allThumbs, setAllThumbs] = useState<{ [key: string]: { x: number; y: number } }>({});

//   // Throttle the function that updates GunDB
//   const updateGunDB = throttle((position: { x: number; y: number }) => {
//     gun.get("thumbPositions").get(userId).put(position);
//   }, 10); // Throttle updates to every 10ms

//   useEffect(() => {
//     let touchStarted = false;

//     const triggerHapticFeedback = () => {
//       if (navigator.vibrate) {
//         navigator.vibrate(50); // Vibrate for 50ms
//       }
//     };

//     const handleTouchStart = () => {
//       if (!touchStarted) {
//         triggerHapticFeedback();
//         touchStarted = true;
//       }
//     };

//     const handleTouchEnd = () => {
//       touchStarted = false;
//     };

//     const updatePosition = (x: number, y: number) => {
//       const newPosition = { x, y };
//       setThumbPosition(newPosition);
//       updateGunDB(newPosition); // Call the throttled function
//     };

//     const handleMouseMove = (event: MouseEvent) => {
//       updatePosition(event.clientX, event.clientY);
//     };

//     const handleTouchMove = (event: TouchEvent) => {
//       if (event.touches.length > 0) {
//         const touch = event.touches[0];
//         updatePosition(touch.clientX, touch.clientY);
//       }
//     };

//     window.addEventListener("mousemove", handleMouseMove);
//     window.addEventListener("touchmove", handleTouchMove);
//     window.addEventListener("touchstart", handleTouchStart);
//     window.addEventListener("touchend", handleTouchEnd);

//     return () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//       window.removeEventListener("touchmove", handleTouchMove);
//       window.removeEventListener("touchstart", handleTouchStart);
//       window.removeEventListener("touchend", handleTouchEnd);
//     };
//   }, []);

//   useEffect(() => {
//     gun.get("thumbPositions").map().on((data, id) => {
//       if (data) {
//         setAllThumbs((prev) => ({ ...prev, [id]: { x: data.x, y: data.y } }));
//       }
//     });
//   }, []);

//   return (
//     <div>
//       <p>Your Thumb Position: X: {thumbPosition.x}, Y: {thumbPosition.y}</p>
//       <h3>Other Users' Thumb Positions:</h3>
//       <ul>
//         {Object.entries(allThumbs).map(([id, pos]) => (
//           <li key={id}>
//             User {id.slice(0, 8)}: X: {pos.x}, Y: {pos.y}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };