// Firebase Authentication Service (Email/Password, Google OAuth & Token Verification)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_API_KEY = 'AIzaSyAqq3YEanICCnbifvSkwnuHH6jzPtW7c-g';
const FIREBASE_AUTH_BASE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

/**
 * Sign Up new user via Firebase Authentication
 * @param {string} email 
 * @param {string} password 
 */
export const firebaseSignUp = async (email, password) => {
    try {
        const response = await axios.post(`${FIREBASE_AUTH_BASE_URL}:signUp?key=${FIREBASE_API_KEY}`, {
            email,
            password,
            returnSecureToken: true
        });

        const { idToken, refreshToken, localId } = response.data;
        await AsyncStorage.setItem('firebase_id_token', idToken);
        await AsyncStorage.setItem('firebase_refresh_token', refreshToken);
        await AsyncStorage.setItem('firebase_uid', localId);

        return { success: true, idToken, localId, email };
    } catch (error) {
        console.error('[Firebase Auth SignUp Error]:', error.response?.data?.error?.message || error.message);
        throw new Error(error.response?.data?.error?.message || 'Firebase Registration Failed');
    }
};

/**
 * Sign In existing user via Firebase Authentication
 * @param {string} email 
 * @param {string} password 
 */
export const firebaseSignIn = async (email, password) => {
    try {
        const response = await axios.post(`${FIREBASE_AUTH_BASE_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`, {
            email,
            password,
            returnSecureToken: true
        });

        const { idToken, refreshToken, localId } = response.data;
        await AsyncStorage.setItem('firebase_id_token', idToken);
        await AsyncStorage.setItem('firebase_refresh_token', refreshToken);
        await AsyncStorage.setItem('firebase_uid', localId);

        return { success: true, idToken, localId, email };
    } catch (error) {
        console.error('[Firebase Auth SignIn Error]:', error.response?.data?.error?.message || error.message);
        throw new Error(error.response?.data?.error?.message || 'Firebase Authentication Failed');
    }
};

/**
 * Send Password Reset Email via Firebase
 * @param {string} email 
 */
export const firebaseSendPasswordReset = async (email) => {
    try {
        await axios.post(`${FIREBASE_AUTH_BASE_URL}:sendOobCode?key=${FIREBASE_API_KEY}`, {
            requestType: 'PASSWORD_RESET',
            email
        });
        return { success: true, message: 'Password reset link sent via Firebase Email.' };
    } catch (error) {
        console.error('[Firebase Reset Password Error]:', error.response?.data?.error?.message || error.message);
        throw new Error(error.response?.data?.error?.message || 'Password Reset Request Failed');
    }
};

/**
 * Get current stored Firebase Token
 */
export const getFirebaseToken = async () => {
    try {
        return await AsyncStorage.getItem('firebase_id_token');
    } catch (err) {
        return null;
    }
};
