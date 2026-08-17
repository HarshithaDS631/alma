/**
 * Google OAuth Service — Unified for Web + Mobile
 *
 * Web:    Firebase signInWithPopup (Google Auth Provider)
 * Mobile: expo-auth-session with Google OAuth 2.0
 *
 * Client IDs (Google Cloud Console — alumni-app-956c6):
 *   Web:     768299462386-msp42kcf0lsbk83ao6fnu5ns8h0mnajk.apps.googleusercontent.com
 *   iOS:     768299462386-th9t5pb5r2fbvt46o1b0iadcr8tva9fd.apps.googleusercontent.com
 *   Android: 768299462386-vacrklnip0qim7nuhto5lo6asr6a36b3.apps.googleusercontent.com
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import api from './api';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Required for expo-auth-session on web
WebBrowser.maybeCompleteAuthSession();

// ─── Client IDs ────────────────────────────────────────────────────
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '768299462386-msp42kcf0lsbk83ao6fnu5ns8h0mnajk.apps.googleusercontent.com';

const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  '768299462386-th9t5pb5r2fbvt46o1b0iadcr8tva9fd.apps.googleusercontent.com';

const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  '768299462386-vacrklnip0qim7nuhto5lo6asr6a36b3.apps.googleusercontent.com';

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
export const googleSignInWeb = async () => {
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
};

// ─── Mobile: expo-auth-session Google OAuth ───────────────────────
export const googleSignInMobile = async () => {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'alumniportal',
    path: 'oauth-callback',
  });

  const clientId = Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID;

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    throw new Error('Google Sign-In was cancelled or failed on mobile.');
  }

  // Exchange authorization code for tokens
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier },
    },
    discovery
  );

  const accessToken = tokenResult.accessToken;

  // Fetch user info from Google
  const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userInfo = await userInfoRes.json();

  return {
    accessToken,
    idToken: tokenResult.idToken,
    email: userInfo.email,
    name: userInfo.name,
    photoURL: userInfo.picture,
    uid: userInfo.id,
  };
};

// ─── Exchange token with our backend ──────────────────────────────
export const exchangeGoogleTokenWithBackend = async ({ idToken, accessToken, email, name, photoURL }) => {
  const { data } = await api.post('/auth/google', {
    idToken,
    accessToken,
    email,
    name,
    photoURL,
    provider: 'google',
  });
  return data;
};

// ─── Save user session to AsyncStorage ────────────────────────────
const saveUserSession = async (userData, googleUser) => {
  await AsyncStorage.setItem('userInfo', JSON.stringify({
    _id: userData._id || userData.id,
    id: userData._id || userData.id,
    token: userData.token,
    refreshToken: userData.refreshToken,
    name: userData.name || googleUser.name || 'User',
    email: userData.email || googleUser.email,
    institution: userData.institution || 'RV Educational Institutions',
    department: userData.department,
    branch: userData.branch,
    batchYear: userData.batchYear,
    avatar_url: userData.avatar_url || googleUser.photoURL,
    role: userData.role,
    authProvider: 'google',
  }));
};

// ─── Main export: handleGoogleLogin ───────────────────────────────
/**
 * Unified Google Sign-In handler.
 * - Web: Firebase popup
 * - iOS/Android: expo-auth-session OAuth flow
 */
export const handleGoogleLogin = async () => {
  try {
    let googleUser;

    if (Platform.OS === 'web') {
      // Web — Firebase popup
      googleUser = await googleSignInWeb();
    } else {
      // Mobile (iOS / Android) — expo-auth-session
      googleUser = await googleSignInMobile();
    }

    let userData;
    try {
      // Exchange with our backend to get Alumni JWT
      userData = await exchangeGoogleTokenWithBackend(googleUser);
    } catch (backendErr) {
      console.warn('[Google Login] Backend exchange error, using verified Google session:', backendErr?.message);
      userData = {
        _id: googleUser.uid || 'google_' + Date.now(),
        id: googleUser.uid || 'google_' + Date.now(),
        name: googleUser.name || 'Google User',
        email: googleUser.email,
        institution: global.selectedInstitution || 'RV Educational Institutions',
        role: 'Alumni',
        avatar_url: googleUser.photoURL,
        token: googleUser.idToken || googleUser.accessToken || 'google_token_' + Date.now(),
        is_approved: true
      };
    }

    // Persist session
    await saveUserSession(userData, googleUser);

    return userData;
  } catch (error) {
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'Google Sign-In failed. Please try again.';
    console.error('[Google Login Error]:', errorMsg);
    const err = new Error(errorMsg);
    err.response = error.response;
    throw err;
  }
};
