/**
 * Apple OAuth Service — Unified for Web + Mobile (iOS)
 *
 * Web:    Firebase signInWithPopup (Apple OAuthProvider)
 * iOS:    expo-apple-authentication native Sign in with Apple
 * Android: Not supported (Apple doesn't offer Sign in with Apple on Android)
 *
 * On iOS, uses the native Apple Sign-In dialog via expo-apple-authentication,
 * which provides a seamless experience without leaving the app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import api from './api';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, OAuthProvider, signInWithPopup } from 'firebase/auth';

// ─── Firebase (Web only) ────────────────────────────────────────────
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

// ─── Web: Firebase popup sign-in ───────────────────────────────────
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

// ─── iOS: Native Apple Sign-In via expo-apple-authentication ──────
export const appleSignInNative = async () => {
  // Dynamic import to avoid crash on Android/Web
  const AppleAuthentication = await import('expo-apple-authentication');

  // Check if Apple Sign-In is available
  const isAvailable = await AppleAuthentication.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Apple Sign-In is not available on this device.');
  }

  // Generate nonce for security
  const nonce = Math.random().toString(36).substring(2, 10);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );

  // Request Apple Sign-In
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  // Build name from Apple credential
  const fullName = credential.fullName
    ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
    : '';

  return {
    idToken: credential.identityToken,
    authorizationCode: credential.authorizationCode,
    email: credential.email,
    name: fullName || 'Apple User',
    uid: credential.user,
    nonce,
  };
};

// ─── Exchange Apple credentials with our backend ──────────────────
export const exchangeAppleTokenWithBackend = async ({ idToken, authorizationCode, email, name, photoURL, uid, nonce }) => {
  const { data } = await api.post('/auth/apple', {
    idToken,
    authorizationCode,
    email,
    name,
    photoURL,
    providerId: uid,
    provider: 'apple',
    nonce,
  });
  return data;
};

// ─── Save user session to AsyncStorage ────────────────────────────
const saveUserSession = async (userData, appleUser) => {
  await AsyncStorage.setItem('userInfo', JSON.stringify({
    _id: userData._id || userData.id,
    id: userData._id || userData.id,
    token: userData.token,
    refreshToken: userData.refreshToken,
    name: userData.name || (appleUser && appleUser.name) || 'Apple User',
    email: userData.email || (appleUser && appleUser.email),
    institution: userData.institution || 'RV Educational Institutions',
    department: userData.department,
    branch: userData.branch,
    batchYear: userData.batchYear,
    avatar_url: userData.avatar_url || (appleUser && appleUser.photoURL) || '',
    role: userData.role || 'Alumni',
    authProvider: 'apple',
  }));
};

// ─── Main export: handleAppleLogin ────────────────────────────────
/**
 * Unified Apple Sign-In handler.
 * - Web: Firebase popup
 * - iOS: Native Apple Sign-In dialog (expo-apple-authentication)
 * - Android: Not supported — Apple doesn't offer Sign in with Apple on Android
 */
export const handleAppleLogin = async () => {
  try {
    let appleUser;

    if (Platform.OS === 'web') {
      // Web — Firebase popup
      appleUser = await appleSignInWeb();
    } else if (Platform.OS === 'ios') {
      // iOS — Native Apple Sign-In dialog
      appleUser = await appleSignInNative();
    } else {
      // Android — Not supported
      throw new Error('Sign in with Apple is only available on iOS and Web.');
    }

    // Exchange with our backend to get Alumni JWT
    const userData = await exchangeAppleTokenWithBackend(appleUser);

    // Persist session
    await saveUserSession(userData, appleUser);

    return userData;
  } catch (error) {
    // Handle Apple Sign-In cancellation gracefully
    if (error.code === 'ERR_REQUEST_CANCELED' || error.code === 'ERR_CANCELED' || error.code === 'auth/popup-closed-by-user') {
      const cancelErr = new Error('Apple Sign-In was cancelled.');
      throw cancelErr;
    }

    if (error.code === 'auth/operation-not-allowed' || error.message?.includes('operation-not-allowed')) {
      const configErr = new Error('Apple Sign-In is currently disabled on your Firebase project. Please enable Apple under Firebase Console > Authentication > Sign-in method.');
      throw configErr;
    }

    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'Apple Sign-In failed. Please try again.';
    console.error('[Apple Login Error]:', errorMsg);
    const err = new Error(errorMsg);
    err.response = error.response;
    throw err;
  }
};
