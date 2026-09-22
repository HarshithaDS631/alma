/**
 * Jest Configuration for Alumni Network
 * Framework: Expo SDK 54 / React Native 0.81
 */
module.exports = {
  preset: 'jest-expo',

  // File extensions to look for
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform configuration
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@supabase/.*|socket\\.io-client)',
  ],

  // Module name mapping for path aliases and assets
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__tests__/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__tests__/__mocks__/styleMock.js',
  },

  // Setup files
  setupFiles: ['<rootDir>/__tests__/setup.js'],

  // Test match patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
  ],

  // Directories to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/dist/',
    '/__tests__/e2e/',     // E2E tests use Maestro, not Jest
    '/__tests__/__mocks__/',
    '/__tests__/setup.js',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'components/**/*.{js,jsx}',
    '!src/screens/**',       // Screens are tested via E2E
    '!**/node_modules/**',
    '!**/dist/**',
  ],

  coverageThreshold: {
    './src/lib/getInitials.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/config/firebaseWebConfig.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Timeout for slow RN tests
  testTimeout: 15000,
};
