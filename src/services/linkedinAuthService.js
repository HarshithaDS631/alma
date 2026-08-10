/**
 * LinkedIn OAuth Service — OpenID Connect Sign-In
 * Supports: Web popup / redirect and Mobile WebBrowser auth session
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api from './api';

const LINKEDIN_CLIENT_ID = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '77xxxxxxxxxxxx';

/**
 * Exchange LinkedIn authorization code or accessToken with backend
 */
export const exchangeLinkedInTokenWithBackend = async ({ code, accessToken, redirectUri }) => {
  const { data } = await api.post('/auth/linkedin', {
    code,
    accessToken,
    redirectUri,
  });
  return data;
};

/**
 * Handle LinkedIn Sign-In
 */
export const handleLinkedInLogin = async () => {
  try {
    const redirectUrl = Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : Linking.createURL('oauth-callback');

    const state = Math.random().toString(36).substring(7);

    // If client ID is not configured, show a clear error instead of creating a fake account
    if (!LINKEDIN_CLIENT_ID || LINKEDIN_CLIENT_ID.startsWith('77xxx')) {
      throw new Error(
        'LinkedIn Sign-In is not configured yet. Please contact the administrator or use another sign-in method.'
      );
    }

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&state=${state}&scope=openid%20profile%20email`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

    if (result.type === 'success' && result.url) {
      const parsed = Linking.parse(result.url);
      const code = parsed.queryParams?.code;

      if (code) {
        const userData = await exchangeLinkedInTokenWithBackend({ code, redirectUri: redirectUrl });
        await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
        return userData;
      }
    }

    throw new Error('LinkedIn login was cancelled or failed.');
  } catch (error) {
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'LinkedIn login failed.';
    console.error('[LinkedIn Login Error]:', errorMsg);
    const err = new Error(errorMsg);
    err.response = error.response;
    throw err;
  }
};
