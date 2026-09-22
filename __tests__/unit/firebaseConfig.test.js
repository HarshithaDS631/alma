/**
 * Unit Tests — Firebase Web Configuration
 * Validates that all required Firebase config keys exist and are properly formatted.
 * Source: src/config/firebaseWebConfig.js
 */
import { firebaseConfig, GOOGLE_WEB_CLIENT_ID } from '../../src/config/firebaseWebConfig';

describe('Firebase Web Configuration', () => {
  // ─── Required keys presence ─────────────────────────────────────
  it('has all required Firebase config keys', () => {
    const requiredKeys = [
      'apiKey',
      'authDomain',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId',
    ];

    requiredKeys.forEach((key) => {
      expect(firebaseConfig).toHaveProperty(key);
      expect(firebaseConfig[key]).toBeTruthy();
    });
  });

  it('has a measurementId (analytics)', () => {
    expect(firebaseConfig).toHaveProperty('measurementId');
    expect(firebaseConfig.measurementId).toBeTruthy();
  });

  // ─── API Key format ─────────────────────────────────────────────
  it('API key starts with "AIza"', () => {
    expect(firebaseConfig.apiKey).toMatch(/^AIza/);
  });

  // ─── Auth domain format ─────────────────────────────────────────
  it('authDomain ends with .firebaseapp.com', () => {
    expect(firebaseConfig.authDomain).toMatch(/\.firebaseapp\.com$/);
  });

  // ─── Project ID format ──────────────────────────────────────────
  it('projectId is a valid lowercase-hyphenated identifier', () => {
    expect(firebaseConfig.projectId).toMatch(/^[a-z0-9-]+$/);
  });

  // ─── Storage bucket format ──────────────────────────────────────
  it('storageBucket ends with .app or .appspot.com', () => {
    expect(firebaseConfig.storageBucket).toMatch(
      /\.(firebasestorage\.app|appspot\.com)$/
    );
  });

  // ─── Messaging sender ID ───────────────────────────────────────
  it('messagingSenderId is numeric', () => {
    expect(firebaseConfig.messagingSenderId).toMatch(/^\d+$/);
  });

  // ─── App ID format ─────────────────────────────────────────────
  it('appId matches Firebase app ID pattern (1:NNNN:platform:hex)', () => {
    expect(firebaseConfig.appId).toMatch(/^\d+:\d+:\w+:[a-f0-9]+$/);
  });

  // ─── Measurement ID ────────────────────────────────────────────
  it('measurementId starts with G-', () => {
    expect(firebaseConfig.measurementId).toMatch(/^G-/);
  });

  // ─── Google Web Client ID ──────────────────────────────────────
  it('GOOGLE_WEB_CLIENT_ID is exported and non-empty', () => {
    expect(GOOGLE_WEB_CLIENT_ID).toBeTruthy();
    expect(typeof GOOGLE_WEB_CLIENT_ID).toBe('string');
  });

  it('GOOGLE_WEB_CLIENT_ID ends with .apps.googleusercontent.com', () => {
    expect(GOOGLE_WEB_CLIENT_ID).toMatch(/\.apps\.googleusercontent\.com$/);
  });

  // ─── Config immutability check ─────────────────────────────────
  it('firebaseConfig contains exactly the expected number of keys', () => {
    const keys = Object.keys(firebaseConfig);
    expect(keys.length).toBeGreaterThanOrEqual(6);
    expect(keys.length).toBeLessThanOrEqual(8); // 6 required + measurementId + optional
  });
});
