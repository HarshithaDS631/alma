import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // 1. Web browser environment
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    if (window.location?.origin && window.location.origin.includes('vercel.app')) {
      return `${window.location.origin}/api`;
    }
  }

  // 2. Native Mobile environment (Android / iOS)
  if (Platform.OS !== 'web') {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    // If explicit production/cloud URL provided
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    // In local development on Android emulator
    if (typeof __DEV__ !== 'undefined' && __DEV__ && Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api';
    }
    // In standalone release build or physical device, localhost is unreachable: fallback to live cloud API
    return 'https://alma-orpin-delta.vercel.app/api';
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'https://alma-orpin-delta.vercel.app/api';
};

export const API_URL = getApiUrl();
const BASE_URL = API_URL;

// High-performance Axios instance with 7-second fail-fast timeout
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 7000,
});

// Fast In-Memory Cache for idempotent GET requests (TTL: 25 seconds)
const apiCache = new Map();
const CACHE_TTL = 25000;

export const fastGet = async (url, config = {}) => {
  const key = `${url}_${JSON.stringify(config.params || {})}`;
  const now = Date.now();
  if (apiCache.has(key)) {
    const entry = apiCache.get(key);
    if (now - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
  }
  const { data } = await api.get(url, config);
  apiCache.set(key, { data, timestamp: now });
  return data;
};

export const invalidateApiCache = (prefix = '') => {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const k of apiCache.keys()) {
    if (k.startsWith(prefix)) apiCache.delete(k);
  }
};

api.interceptors.request.use(
  async (config) => {
    let token = null;

    const keysToTry = ['userToken', 'token', 'firebase_id_token', 'jwtToken', 'auth_token'];
    for (const key of keysToTry) {
      try {
        const val = await AsyncStorage.getItem(key);
        if (val) { token = val; break; }
      } catch (_) {}
    }

    if (!token) {
      try {
        const userInfoRaw = await AsyncStorage.getItem('userInfo');
        if (userInfoRaw) {
          const parsed = JSON.parse(userInfoRaw);
          token = parsed.token || parsed.accessToken || parsed.idToken || parsed.jwt;
        }
      } catch (_) {}
    }

    // Web localStorage fallback
    if (!token && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        token = window.localStorage.getItem('userToken') || 
                window.localStorage.getItem('token') || 
                window.localStorage.getItem('firebase_id_token') ||
                window.localStorage.getItem('jwtToken');
        if (!token) {
          const raw = window.localStorage.getItem('userInfo');
          if (raw) {
            const parsed = JSON.parse(raw);
            token = parsed?.token || parsed?.accessToken || parsed?.idToken;
          }
        }
      } catch (_) {}
    }

    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
          authorization: `Bearer ${token}`
        };
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatic Refresh Token & Revocation Recovery Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Invalidate cache on mutations
    if (['post', 'put', 'delete', 'patch'].includes(originalRequest?.method?.toLowerCase())) {
      invalidateApiCache();
    }

    // If 401 Unauthorized, not already retried, and not an auth/refresh endpoint
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      try {
        let refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          const userInfoRaw = await AsyncStorage.getItem('userInfo');
          if (userInfoRaw) {
            const userInfo = JSON.parse(userInfoRaw);
            refreshToken = userInfo.refreshToken;
          }
        }
        if (!refreshToken && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          refreshToken = window.localStorage.getItem('refreshToken');
        }

        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken }, { timeout: 5000 });
          if (res.data?.token) {
            const newToken = res.data.token;
            await AsyncStorage.setItem('userToken', newToken);
            await AsyncStorage.setItem('token', newToken);

            const userInfoRaw = await AsyncStorage.getItem('userInfo');
            if (userInfoRaw) {
              const userInfo = JSON.parse(userInfoRaw);
              userInfo.token = newToken;
              if (res.data.refreshToken) userInfo.refreshToken = res.data.refreshToken;
              await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
            }

            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem('userToken', newToken);
              window.localStorage.setItem('token', newToken);
            }

            if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
            } else {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              originalRequest.headers.authorization = `Bearer ${newToken}`;
            }
            return axios(originalRequest);
          }
        }
      } catch (refreshErr) {
        console.warn('Token refresh failed:', refreshErr?.message);
      }

      // Stale token cleanup
      const staleKeys = ['userToken', 'token', 'jwtToken', 'firebase_id_token', 'auth_token'];
      for (const k of staleKeys) {
        try { await AsyncStorage.removeItem(k); } catch (_) {}
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          try { window.localStorage.removeItem(k); } catch (_) {}
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
