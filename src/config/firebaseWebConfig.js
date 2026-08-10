/**
 * Firebase Web Configuration & Initialization
 * Project: alumni-app-956c6
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAqQ3YEanICCnbifvSkwnuHH6jzPtW7c-g",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "alumni-app-956c6.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "alumni-app-956c6",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "alumni-app-956c6.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "768299462386",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:768299462386:web:1008da97ccf4a0efd3ea6b",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5G5CH95JXH"
};

// Google OAuth Web Client ID — from Google Cloud Console (alumni-app-956c6)
// Used by Firebase Auth for Google Sign-In popup on Web
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '768299462386-msp42kcf0lsbk83ao6fnu5ns8h0mnajk.apps.googleusercontent.com';

export default firebaseConfig;

