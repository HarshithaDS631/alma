/**
 * Apple OAuth Service — Official Firebase Web SDK & Apple Authentication
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from './api';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, OAuthProvider, signInWithPopup } from 'firebase/auth';

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
 * Apple Sign-In via Firebase Web popup (Official SDK)
 */
export const appleSignInWeb = async () => {
  const auth = getFirebaseAuth();
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  return {
    idToken,
    email: result.user.email,
    name: result.user.displayName || 'Apple User',
    photoURL: result.user.photoURL || '',
    uid: result.user.uid,
  };
};

/**
 * Exchange Apple ID Token with Backend
 */
export const exchangeAppleTokenWithBackend = async ({ idToken, email, name, photoURL, uid }) => {
  const { data } = await api.post('/auth/apple', {
    idToken,
    email,
    name,
    photoURL,
    providerId: uid,
    provider: 'apple',
  });
  return data;
};

/**
 * Full Apple OAuth Login (Official SDK)
 */
export const handleAppleLogin = async () => {
  if (Platform.OS !== 'web') {
    throw new Error('Apple Sign-In is configured via Web SDK.');
  }

  const appleUser = await appleSignInWeb();
  const userData = await exchangeAppleTokenWithBackend(appleUser);

  await AsyncStorage.setItem('userInfo', JSON.stringify({
    _id: userData._id || userData.id,
    id: userData._id || userData.id,
    token: userData.token,
    refreshToken: userData.refreshToken,
    name: userData.name || appleUser.name || 'Apple User',
    email: userData.email || appleUser.email,
    institution: userData.institution || 'RV Educational Institutions',
    department: userData.department,
    branch: userData.branch,
    batchYear: userData.batchYear,
    avatar_url: userData.avatar_url || appleUser.photoURL,
    role: userData.role || 'Alumni',
    authProvider: 'apple',
  }));

  return userData;
};
