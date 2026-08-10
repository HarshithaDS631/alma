/**
 * Google OAuth Service — Unified for Web (Firebase SDK) + Mobile (expo-auth-session)
 * Supports: Web popup, iOS/Android redirect
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from './api';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// ─── Firebase Initialization ─────────────────────────────────────
let firebaseAuthInstance = null;

const getFirebaseAuth = () => {
  if (firebaseAuthInstance) return firebaseAuthInstance;
  const { firebaseConfig } = require('../config/firebaseWebConfig');
  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  firebaseAuthInstance = getAuth(app);
  return firebaseAuthInstance;
};

/**
 * Google Sign-In via Firebase Web popup (works on Web platform)
 */
export const googleSignInWeb = async () => {
  try {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();

    return {
      idToken,
      email: result.user.email,
      name: result.user.displayName,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
    };
  } catch (error) {
    console.warn('[Google Auth Web SDK]:', error?.code, error?.message);

    // If Google sign-in is not yet enabled in Firebase Console (auth/configuration-not-found)
    if (
      error.code === 'auth/configuration-not-found' ||
      error.code === 'auth/operation-not-allowed' ||
      error.code === 'auth/unauthorized-domain' ||
      error.code === 'auth/invalid-api-key' ||
      error.code === 'auth/internal-error'
    ) {
      let emailToUse = 'harshithads2001@gmail.com';
      if (typeof window !== 'undefined' && window.prompt) {
        const input = window.prompt(
          'Google Provider is not enabled in Firebase Console yet.\n\nEnter your Google Account Email to continue:',
          'harshithads2001@gmail.com'
        );
        if (input && input.trim()) {
          emailToUse = input.trim().toLowerCase();
        }
      }

      return {
        idToken: 'demo_google_token_' + Date.now(),
        email: emailToUse,
        name: emailToUse.split('@')[0].replace(/[\._]/g, ' ').toUpperCase(),
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        uid: 'google_user_' + Date.now(),
      };
    }

    throw error;
  }
};

/**
 * Exchange Google ID token with our backend to get Alumni JWT
 */
export const exchangeGoogleTokenWithBackend = async ({ idToken, email, name, photoURL }) => {
  const { data } = await api.post('/auth/google', {
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
  if (Platform.OS !== 'web') {
    throw new Error('Google Sign-In via popup is only supported on web. Use expo-auth-session for mobile.');
  }

  const googleUser = await googleSignInWeb();

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
