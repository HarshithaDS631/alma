/**
 * Global Test Setup for Alumni Network
 * Mocks platform-specific modules that don't work in Jest's jsdom environment.
 */

// ─── Mock AsyncStorage ───────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    __esModule: true,
    default: {
      setItem: jest.fn((key, value) => {
        store[key] = value;
        return Promise.resolve(null);
      }),
      getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
      removeItem: jest.fn((key) => {
        delete store[key];
        return Promise.resolve(null);
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
        return Promise.resolve(null);
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
      multiGet: jest.fn((keys) =>
        Promise.resolve(keys.map((k) => [k, store[k] || null]))
      ),
      multiSet: jest.fn((pairs) => {
        pairs.forEach(([k, v]) => { store[k] = v; });
        return Promise.resolve(null);
      }),
    },
  };
});

// ─── Mock expo-notifications ─────────────────────────────────────────
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true })
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true })
  ),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: 'ExponentPushToken[mock-token-12345]' })
  ),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 },
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
}));

// ─── Mock expo-constants ─────────────────────────────────────────────
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:5000/api',
        eas: { projectId: 'test-project-id' },
      },
    },
    executionEnvironment: 'storeClient',
  },
}));

// ─── Mock expo-splash-screen ─────────────────────────────────────────
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// ─── Mock @react-navigation ─────────────────────────────────────────
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    reset: mockReset,
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
}));

// ─── Mock expo-image-picker ─────────────────────────────────────────
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: [] })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: [] })
  ),
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  MediaTypeOptions: { All: 'All', Images: 'Images', Videos: 'Videos' },
}));

// ─── Mock expo-haptics ──────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// ─── Mock Supabase ──────────────────────────────────────────────────
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
      })),
    },
  })),
}));

// ─── Suppress noisy React Native warnings in test output ─────────
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Animated:') ||
    msg.includes('NativeEventEmitter') ||
    msg.includes('ViewPropTypes')
  ) {
    return; // suppress known RN noise
  }
  originalConsoleWarn.apply(console, args);
};

// ─── Export navigation mocks for use in tests ────────────────────
global.__mockNavigate = mockNavigate;
global.__mockGoBack = mockGoBack;
global.__mockReset = mockReset;
