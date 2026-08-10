/**
 * Facebook OAuth Service — Unified for Web (Firebase SDK) + Mobile fallback
 * Supports: Web popup, iOS/Android redirect
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from './api';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';

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
 * Facebook Sign-In via Firebase Web popup
 */
export const facebookSignInWeb = async () => {
  const auth = getFirebaseAuth();
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');

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
 * Exchange Facebook ID / Access token with our backend to get Alumni JWT
 */
export const exchangeFacebookTokenWithBackend = async ({ idToken, accessToken, email, name, photoURL, uid }) => {
  const { data } = await api.post('/auth/facebook', {
    idToken,
    accessToken,
    email,
    name,
    photoURL,
    providerId: uid,
    provider: 'facebook',
  });
  return data;
};

/**
 * Full Facebook OAuth Login — handles popup + saves session
 */
export const handleFacebookLogin = async () => {
  try {
    if (Platform.OS !== 'web') {
      throw new Error('Facebook Sign-In is currently optimized for Web platform.');
    }

    const fbUser = await facebookSignInWeb();

    // Exchange with our backend
    const userData = await exchangeFacebookTokenWithBackend(fbUser);

    // Save session
    await AsyncStorage.setItem('userInfo', JSON.stringify({
      _id: userData._id || userData.id,
      id: userData._id || userData.id,
      token: userData.token,
      refreshToken: userData.refreshToken,
      name: userData.name || fbUser.name || 'Facebook User',
      email: userData.email || fbUser.email,
      institution: userData.institution || 'RV Educational Institutions',
      department: userData.department,
      branch: userData.branch,
      batchYear: userData.batchYear,
      avatar_url: userData.avatar_url || fbUser.photoURL,
      role: userData.role || 'Alumni',
      authProvider: 'facebook',
    }));

    return userData;
  } catch (error) {
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'Facebook Sign-In failed. Please try again.';
    console.error('[Facebook Login Error]:', errorMsg);
    const err = new Error(errorMsg);
    err.response = error.response;
    throw err;
  }
};
