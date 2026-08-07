/**
 * Google OAuth Service — Unified for Web (Firebase SDK) + Mobile (expo-auth-session)
 * Supports: Web popup, iOS/Android redirect
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from './api';

// ─── Firebase Web SDK Google Sign-In ─────────────────────────────
let firebaseApp = null;
let firebaseAuth = null;

const initFirebase = async () => {
  if (firebaseApp) return { app: firebaseApp, auth: firebaseAuth };
  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');
    const { firebaseConfig } = await import('../config/firebaseWebConfig');

    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
    firebaseAuth = getAuth(firebaseApp);
    return { app: firebaseApp, auth: firebaseAuth };
  } catch (e) {
    console.error('[Firebase Init]', e.message);
    return null;
  }
};

/**
 * Google Sign-In via Firebase Web popup (works on Web platform)
 */
export const googleSignInWeb = async () => {
  const { auth } = await initFirebase();
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  return {
    idToken,
    email: result.user.email,
    name: result.user.displayName,
    photoURL: result.user.photoURL,
    uid: result.user.uid,
  };
};

/**
 * Exchange Google ID token with our backend to get Alumni JWT
 */
export const exchangeGoogleTokenWithBackend = async ({ idToken, email, name, photoURL }) => {
  const { data } = await api.post('/auth/firebase-google', {
    idToken,
    email,
    name,
    photoURL,
    provider: 'google',
  });
  return data;
};

/**
 * Full Google OAuth Login — handles web popup + saves session
 */
export const handleGoogleLogin = async () => {
  let googleUser = null;

  if (Platform.OS === 'web') {
    googleUser = await googleSignInWeb();
  } else {
    // Mobile: use expo-auth-session Google flow
    const { makeRedirectUri } = await import('expo-auth-session');
    const { useAuthRequest } = await import('expo-auth-session/providers/google');
    throw new Error('Use useGoogleAuth hook in mobile component');
  }

  // Exchange with our backend
  const userData = await exchangeGoogleTokenWithBackend(googleUser);

  // Save session
  await AsyncStorage.setItem('userInfo', JSON.stringify({
    _id: userData._id || userData.id,
    id: userData._id || userData.id,
    token: userData.token,
    refreshToken: userData.refreshToken,
    name: userData.name || googleUser.name || 'User',
    email: userData.email || googleUser.email,
    institution: userData.institution || 'Institution',
    department: userData.department,
    branch: userData.branch,
    batchYear: userData.batchYear,
    avatar_url: userData.avatar_url || googleUser.photoURL,
    role: userData.role,
    authProvider: 'google',
  }));

  return userData;
};
