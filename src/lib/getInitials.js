/**
 * Returns proper initials from a full name string.
 * E.g. "Mediacell Admin" → "MA", "John" → "JO", null → fallback
 * 
 * @param {string} name - The full name
 * @param {string} fallback - Fallback initials if name is missing (default: 'MA')
 * @returns {string} Two-character uppercase initials
 */
const getInitials = (name, fallback = 'MA') => {
  if (!name || typeof name !== 'string') return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0] || fallback).toUpperCase().substring(0, 2);
};

export default getInitials;
