import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// FOR PHYSICAL DEVICE TESTING: Replace 'localhost' with your machine's IP address (e.g. 192.168.x.x)
// FOR EMULATOR TESTING: Use 10.0.2.2 for Android
// FOR VERCEL DEPLOYMENT: Configure EXPO_PUBLIC_API_URL in Vercel settings
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Default to the live Vercel backend so physical devices work out of the box
  // without needing a local backend server running.
  return 'https://backend-pi-bice-97.vercel.app/api';
};

export const API_URL = getApiUrl();
const BASE_URL = API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  async (config) => {
    let token = null;

    try {
      token = await AsyncStorage.getItem('userToken');
    } catch (e) {}

    if (!token) {
      try {
        token = await AsyncStorage.getItem('token');
      } catch (e) {}
    }

    if (!token) {
      try {
        const userInfoRaw = await AsyncStorage.getItem('userInfo');
        if (userInfoRaw) {
          const parsed = JSON.parse(userInfoRaw);
          token = parsed.token || parsed.accessToken || parsed.idToken;
        }
      } catch (e) {}
    }

    // Web localStorage fallback
    if (!token && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        token = window.localStorage.getItem('userToken') || 
                window.localStorage.getItem('token') || 
                window.localStorage.getItem('firebase_id_token');
        if (!token) {
          const raw = window.localStorage.getItem('userInfo');
          if (raw) {
            token = JSON.parse(raw)?.token;
          }
        }
      } catch (e) {}
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatic Refresh Token Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 error, not already retrying, and not login/auth attempt
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      try {
        const userInfoRaw = await AsyncStorage.getItem('userInfo');
        if (userInfoRaw) {
          const userInfo = JSON.parse(userInfoRaw);
          if (userInfo.refreshToken) {
            // Call refresh-token endpoint directly with plain axios
            const res = await axios.post(`${BASE_URL}/auth/refresh-token`, {
              refreshToken: userInfo.refreshToken
            });

            if (res.data?.token) {
              userInfo.token = res.data.token;
              if (res.data.refreshToken) {
                userInfo.refreshToken = res.data.refreshToken;
              }
              await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));

              originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
              return axios(originalRequest);
            }
          }
        }
      } catch (refreshErr) {
        console.warn('Token refresh error:', refreshErr?.message);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

