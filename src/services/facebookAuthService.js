/**
 * Facebook OAuth Service — Unified for Web + Mobile
 *
 * Web:    Firebase signInWithPopup (Facebook Auth Provider)
 * Mobile: expo-auth-session with Facebook OAuth 2.0
 *
 * Facebook OAuth uses standard OAuth 2.0 on mobile via expo-auth-session.
 * The access token is sent to the backend which verifies it via Graph API.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import api from './api';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';

// Required for expo-auth-session
WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';

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

// ─── Mobile: expo-auth-session Facebook OAuth ─────────────────────
export const facebookSignInMobile = async () => {
  if (!FACEBOOK_APP_ID || FACEBOOK_APP_ID.length < 5) {
    throw new Error(
      'Facebook Sign-In is not configured yet. Please contact the administrator or use another sign-in method.'
    );
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'alumniportal',
    path: 'oauth-callback',
  });

  const discovery = {
    authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
  };

  const request = new AuthSession.AuthRequest({
    clientId: FACEBOOK_APP_ID,
    scopes: ['email', 'public_profile'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
  });

  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params?.code) {
    throw new Error('Facebook Sign-In was cancelled or failed.');
  }

  // Exchange code for access token (Facebook requires client secret for server-side,
  // but for mobile we can use the code directly via the token endpoint)
  // Send the code to our backend to exchange securely
  const { data: userData } = await api.post('/auth/facebook', {
    code: result.params.code,
    redirectUri,
    provider: 'facebook',
  });

  return userData;
};

// ─── Exchange token with our backend ──────────────────────────────
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

// ─── Save user session to AsyncStorage ────────────────────────────
const saveUserSession = async (userData, fbUser) => {
  await AsyncStorage.setItem('userInfo', JSON.stringify({
    _id: userData._id || userData.id,
    id: userData._id || userData.id,
    token: userData.token,
    refreshToken: userData.refreshToken,
    name: userData.name || (fbUser && fbUser.name) || 'Facebook User',
    email: userData.email || (fbUser && fbUser.email),
    institution: userData.institution || 'RV Educational Institutions',
    department: userData.department,
    branch: userData.branch,
    batchYear: userData.batchYear,
    avatar_url: userData.avatar_url || (fbUser && fbUser.photoURL),
    role: userData.role || 'Alumni',
    authProvider: 'facebook',
  }));
};

// ─── Main export: handleFacebookLogin ─────────────────────────────
/**
 * Unified Facebook Sign-In handler.
 * - Web: Firebase popup
 * - iOS/Android: expo-auth-session OAuth flow
 */
export const handleFacebookLogin = async () => {
  try {
    let userData;

    if (Platform.OS === 'web') {
      // Web — Firebase popup
      const fbUser = await facebookSignInWeb();
      userData = await exchangeFacebookTokenWithBackend(fbUser);
      await saveUserSession(userData, fbUser);
    } else {
      // Mobile (iOS / Android) — expo-auth-session
      userData = await facebookSignInMobile();
      await saveUserSession(userData, null);
    }

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
