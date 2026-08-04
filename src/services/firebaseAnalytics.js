// Firebase Analytics Tracker (Screen Views, User Engagement & Custom Events)
import axios from 'axios';
import { Platform } from 'react-native';

const FIREBASE_API_KEY = 'AIzaSyAqq3YEanICCnbifvSkwnuHH6jzPtW7c-g';
const MEASUREMENT_ID = 'G-768299462'; // Firebase Analytics Measurement ID

/**
 * Log a custom event to Firebase Analytics
 * @param {string} eventName - Name of event (e.g. 'login', 'page_view', 'birthday_wished')
 * @param {object} eventParams - Additional metadata key-value pairs
 */
export const logFirebaseAnalyticsEvent = async (eventName, eventParams = {}) => {
    try {
        const payload = {
            client_id: eventParams.userId || 'anonymous_user',
            events: [{
                name: eventName,
                params: {
                    platform: Platform.OS,
                    timestamp: new Date().toISOString(),
                    ...eventParams
                }
            }]
        };

        // Firebase Analytics Measurement Protocol Endpoint
        const endpoint = `https://www.google-analytics.com/mp/collect?api_secret=${FIREBASE_API_KEY}&measurement_id=${MEASUREMENT_ID}`;
        
        // Log event to console for dev debugging
        console.log(`[Firebase Analytics Event]: ${eventName}`, eventParams);

        await axios.post(endpoint, payload).catch(() => {
            // Gracefully handle offline or network hiccups without throwing UI errors
        });
    } catch (error) {
        console.warn('[Firebase Analytics Logging Warning]:', error.message);
    }
};

/**
 * Log Screen View Event
 * @param {string} screenName 
 */
export const logScreenView = (screenName) => {
    logFirebaseAnalyticsEvent('screen_view', { firebase_screen: screenName, firebase_screen_class: screenName });
};

/**
 * Log User Login Event
 * @param {string} userId 
 * @param {string} method 
 */
export const logUserLogin = (userId, method = 'Email/Password') => {
    logFirebaseAnalyticsEvent('login', { userId, method });
};

/**
 * Log Post Creation Event
 * @param {string} postId 
 */
export const logPostCreated = (postId) => {
    logFirebaseAnalyticsEvent('create_post', { postId });
};

/**
 * Log Birthday Wished Event
 * @param {string} recipientId 
 */
export const logBirthdayWished = (recipientId) => {
    logFirebaseAnalyticsEvent('birthday_wished', { recipientId });
};
