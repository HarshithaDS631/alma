/**
 * app.config.js — Dynamic Expo configuration
 *
 * This replaces static app.json for production builds.
 * EAS Build injects environment variables per profile at build time.
 * Local development reads from .env / .env.local automatically.
 */

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const APP_NAME = IS_DEV ? 'Alumni [Dev]' : IS_PREVIEW ? 'Alumni [Preview]' : 'Alumni Network';
const BUNDLE_ID = IS_DEV
  ? 'com.mediacell.alumni.dev'
  : IS_PREVIEW
  ? 'com.mediacell.alumni.preview'
  : 'com.mediacell.alumni';

export default {
  expo: {
    name: APP_NAME,
    slug: 'alumni-portal',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'alumniportal',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    description:
      'The official Alumni Network app for RV Institutions. Connect with alumni, explore career opportunities, find mentors, attend events, and stay engaged with your college community.',

    privacy: 'unlisted',

    web: {
      favicon: './assets/images/favicon.png',
      name: 'Alumni Network',
      shortName: 'Alumni',
      description: 'Connect with your college alumni community.',
      themeColor: '#002144',
      backgroundColor: '#ffffff',
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: BUNDLE_ID,
      buildNumber: '1.0.0',
      requireFullScreen: false,
      usesAppleSignIn: false,
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          'Allow Alumni Network to access your photos for profile pictures and post uploads.',
        NSCameraUsageDescription:
          'Allow Alumni Network to access your camera for taking profile pictures.',
        NSMicrophoneUsageDescription:
          'Allow Alumni Network to access your microphone for video recording.',
        NSContactsUsageDescription:
          'Allow Alumni Network to access contacts to help you connect with alumni.',
        NSUserNotificationsUsageDescription:
          'Allow Alumni Network to send you notifications for messages, events, and job updates.',
        ITSAppUsesNonExemptEncryption: false,
      },
      entitlements: {
        'aps-environment': IS_DEV ? 'development' : 'production',
      },
    },

    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      package: BUNDLE_ID,
      versionCode: 1,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      permissions: [
        'android.permission.INTERNET',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'alumni-app-nine.vercel.app',
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },

    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#002144',
          sounds: [],
        },
      ],
      [
        'expo-updates',
        {
          username: 'mediacell',
        },
      ],
    ],

    updates: {
      url: 'https://u.expo.dev/alumni-network',
      fallbackToCacheTimeout: 0,
    },

    runtimeVersion: {
      policy: 'appVersion',
    },

    extra: {
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL ??
        'https://backend-pi-bice-97.vercel.app/api',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? '',
      },
    },

    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
  },
};
