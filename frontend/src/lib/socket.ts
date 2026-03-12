import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket: ReturnType<typeof io> | null = null;

export function getSocket() {
  if (!socket) {
    const url = new URL(API_BASE_URL);
    console.log("Socket Client: Connecting to WebSocket at:", url.origin);

    socket = io(url.origin, {
      path: "/socket.io",
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("Socket Client: Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      console.log("Socket Client: Disconnected from WebSocket server");
    });

    socket.on("connect_error", (error) => {
      console.log("Socket Client: Connection error:", error);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
