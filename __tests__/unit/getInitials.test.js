/**
 * Unit Tests — getInitials utility
 * Source: src/lib/getInitials.js
 */
import getInitials from '../../src/lib/getInitials';

describe('getInitials', () => {
  // ─── Two-word names ─────────────────────────────────────────────
  it('returns first + last initials for a two-word name', () => {
    expect(getInitials('Mediacell Admin')).toBe('MA');
  });

  it('returns first + last initials for a three-word name', () => {
    expect(getInitials('John Michael Doe')).toBe('JD');
  });

  it('returns first + last initials for names with extra spaces', () => {
    expect(getInitials('  Jane   Doe  ')).toBe('JD');
  });

  // ─── Single-word names ──────────────────────────────────────────
  it('returns first two letters for a single-word name', () => {
    expect(getInitials('John')).toBe('JO');
  });

  it('returns uppercase for a single lowercase word', () => {
    expect(getInitials('alice')).toBe('AL');
  });

  // ─── Edge cases ─────────────────────────────────────────────────
  it('returns fallback for null', () => {
    expect(getInitials(null)).toBe('MA');
  });

  it('returns fallback for undefined', () => {
    expect(getInitials(undefined)).toBe('MA');
  });

  it('returns fallback for empty string', () => {
    expect(getInitials('')).toBe('MA');
  });

  it('returns fallback for whitespace-only string', () => {
    expect(getInitials('   ')).toBe('MA');
  });

  it('returns fallback for numeric input', () => {
    expect(getInitials(123)).toBe('MA');
  });

  it('returns custom fallback when provided', () => {
    expect(getInitials(null, 'XX')).toBe('XX');
  });

  // ─── Single-character name ──────────────────────────────────────
  it('handles a single-character name gracefully', () => {
    const result = getInitials('A');
    expect(result).toHaveLength(1);
    expect(result).toBe('A');
  });

  // ─── Unicode / International names ──────────────────────────────
  it('handles names with accented characters', () => {
    expect(getInitials('José García')).toBe('JG');
  });

  // ─── Mixed case ─────────────────────────────────────────────────
  it('always returns uppercase', () => {
    expect(getInitials('alice bob')).toBe('AB');
    expect(getInitials('alice')).toBe('AL');
  });
});
