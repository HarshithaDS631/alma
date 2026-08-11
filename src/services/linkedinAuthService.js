/**
 * LinkedIn OAuth Service — Unified for Web + Mobile
 *
 * Web:    WebBrowser redirect (OAuth 2.0 Authorization Code)
 * Mobile: expo-auth-session with LinkedIn OpenID Connect
 *
 * LinkedIn uses standard OAuth 2.0 + OpenID Connect.
 * The authorization code is exchanged server-side using LINKEDIN_CLIENT_SECRET.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import api from './api';

// Required for expo-auth-session
WebBrowser.maybeCompleteAuthSession();

const LINKEDIN_CLIENT_ID = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '';

// ─── LinkedIn OAuth Discovery ──────────────────────────────────────
const discovery = {
  authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
};

// ─── Exchange authorization code with our backend ──────────────────
export const exchangeLinkedInTokenWithBackend = async ({ code, redirectUri }) => {
  const { data } = await api.post('/auth/linkedin', {
    code,
    redirectUri,
  });
  return data;
};

// ─── Save user session to AsyncStorage ─────────────────────────────
const saveUserSession = async (userData) => {
  await AsyncStorage.setItem('userInfo', JSON.stringify({
    _id: userData._id || userData.id,
    id: userData._id || userData.id,
    token: userData.token,
    refreshToken: userData.refreshToken,
    name: userData.name || 'LinkedIn User',
    email: userData.email,
    institution: userData.institution || 'RV Educational Institutions',
    department: userData.department,
    branch: userData.branch,
    batchYear: userData.batchYear,
    avatar_url: userData.avatar_url,
    role: userData.role,
    authProvider: 'linkedin',
  }));
};

// ─── Main export: handleLinkedInLogin ──────────────────────────────
/**
 * Unified LinkedIn Sign-In handler.
 * Works on Web, iOS, and Android using expo-auth-session.
 * The authorization code is sent to the backend which exchanges it
 * for an access token using the client secret (server-side).
 */
export const handleLinkedInLogin = async () => {
  try {
    // Validate configuration
    if (!LINKEDIN_CLIENT_ID || LINKEDIN_CLIENT_ID.length < 10) {
      throw new Error(
        'LinkedIn Sign-In is not configured yet. Please contact the administrator or use another sign-in method.'
      );
    }

    // Build redirect URI using expo-auth-session (works on all platforms)
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'alumniportal',
      path: Platform.OS === 'web' ? 'login' : 'oauth-callback',
    });

    // Create OAuth request with PKCE (more secure)
    const request = new AuthSession.AuthRequest({
      clientId: LINKEDIN_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    });

    // Prompt user to authorize
    await request.makeAuthUrlAsync(discovery);
    const result = await request.promptAsync(discovery);

    if (result.type !== 'success' || !result.params?.code) {
      throw new Error('LinkedIn login was cancelled or failed.');
    }

    // Exchange authorization code with our backend (server-side token exchange)
    const userData = await exchangeLinkedInTokenWithBackend({
      code: result.params.code,
      redirectUri,
    });

    // Persist session
    await saveUserSession(userData);

    return userData;
  } catch (error) {
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'LinkedIn Sign-In failed. Please try again.';
    console.error('[LinkedIn Login Error]:', errorMsg);
    const err = new Error(errorMsg);
    err.response = error.response;
    throw err;
  }
};
