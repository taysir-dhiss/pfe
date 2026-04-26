import { io } from "socket.io-client";

// Direct connection to backend (bypasses CRA proxy — needed for WebSocket upgrade)
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 8000,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
