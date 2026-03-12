import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket: ReturnType<typeof io> | null = null;

export function getSocket() {
  if (!socket) {
    const url = new URL(API_BASE_URL);
    socket = io(url.origin, {
      path: '/socket.io',
      autoConnect: true,
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
