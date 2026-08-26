import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getSocketUrl = () => {
  if (typeof window !== 'undefined' && 
      (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

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

  const url = getSocketUrl();
  socket = io(url, {
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
