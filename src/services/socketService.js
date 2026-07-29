import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend-pi-bice-97.vercel.app';

let socket = null;

export const initSocket = async (userId) => {
  if (socket && socket.connected) {
    if (userId) socket.emit('join_user_room', userId);
    return socket;
  }

  let token = null;
  try {
    token = await AsyncStorage.getItem('token');
  } catch (_) {}

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[SocketService WSS] Connected to real-time server:', socket.id);
    if (userId) {
      socket.emit('join_user_room', userId);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[SocketService WSS] Disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
