import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    // Get the base URL by stripping '/api' from the backend URL if it exists
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://mayaerp.onrender.com/api";
    const serverUrl = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl;
    
    socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
  }
  return socket;
};
