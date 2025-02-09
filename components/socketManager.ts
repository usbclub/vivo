import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(); // Initialize the socket connection
  }

  return socket;
};