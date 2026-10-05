/**
 * Frontend Password Validator & Strength Utility
 * Shared across Registration, Profile, AdminProfile, and ResetPassword screens.
 */

export const COMMON_WEAK_PASSWORDS = new Set([
  'password', 'password123', 'admin123', 'admin@123', 'qwerty123',
  '12345678', '123456789', '1234567890', 'alumni123', 'rvce123',
  'welcome123', 'pass1234', 'iloveyou', 'sunshine', 'princess',
  'football', 'monkey123', 'dragon123', 'master123', 'trustno1'
]);

export const PASSWORD_CRITERIA_LIST = [
  { id: 'minLength', label: 'At least 8 characters' },
  { id: 'uppercase', label: 'One uppercase letter (A-Z)' },
  { id: 'lowercase', label: 'One lowercase letter (a-z)' },
  { id: 'number', label: 'One numeric digit (0-9)' },
  { id: 'special', label: 'One special character (!@#$%...)' },
];

/**
 * Validates password and provides detailed feedback
 * @param {string} password 
 * @returns {{ valid: boolean, reason?: string, message: string, score: number, checks: object, level: string, color: string }}
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      reason: 'Password is required.',
      message: 'Password is required.',
      score: 0,
      level: 'Empty',
      color: '#EF4444',
      checks: { minLength: false, uppercase: false, lowercase: false, number: false, special: false, notCommon: false, noSpaces: false }
    };
  }

  const trimmed = password.trim();
  if (trimmed.length !== password.length) {
    return {
      valid: false,
      reason: 'Password cannot contain leading or trailing spaces.',
      message: 'Password cannot contain leading or trailing spaces.',
      score: 10,
      level: 'Invalid',
      color: '#EF4444',
      checks: { minLength: false, uppercase: false, lowercase: false, number: false, special: false, notCommon: false, noSpaces: false }
    };
  }

  const checks = {
    minLength: password.length >= 8 && password.length <= 128,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`';]/.test(password),
    noSpaces: !/\s/.test(password),
    notCommon: !COMMON_WEAK_PASSWORDS.has(password.toLowerCase())
  };

  let score = 0;
  if (checks.minLength) score += 20;
  if (checks.uppercase) score += 20;
  if (checks.lowercase) score += 20;
  if (checks.number) score += 20;
  if (checks.special) score += 10;
  if (checks.notCommon && checks.noSpaces) score += 10;

  let level = 'Weak';
  let color = '#EF4444'; // Red
  if (score >= 80) {
    level = 'Strong';
    color = '#10B981'; // Green
  } else if (score >= 60) {
    level = 'Good';
    color = '#3B82F6'; // Blue
  } else if (score >= 40) {
    level = 'Fair';
    color = '#F59E0B'; // Amber
  }

  if (!checks.minLength) {
    const msg = password.length < 8 ? 'Password must be at least 8 characters long.' : 'Password must be at most 128 characters.';
    return { valid: false, reason: msg, message: msg, score, level, color, checks };
  }

  if (!checks.noSpaces) {
    const msg = 'Password cannot contain whitespace characters.';
    return { valid: false, reason: msg, message: msg, score, level, color, checks };
  }

  if (!checks.uppercase) {
    const msg = 'Password must contain at least one uppercase letter (A-Z).';
    return { valid: false, reason: msg, message: msg, score, level, color, checks };
  }

  if (!checks.lowercase) {
    const msg = 'Password must contain at least one lowercase letter (a-z).';
    return { valid: false, reason: msg, message: msg, score, level, color, checks };
  }

  if (!checks.number) {
    const msg = 'Password must contain at least one numeric digit (0-9).';
    return { valid: false, reason: msg, message: msg, score, level, color, checks };
  }

  if (!checks.special) {
    const msg = 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>...).';
    return { valid: false, reason: msg, message: msg, score, level, color, checks };
  }

  if (!checks.notCommon) {
    const msg = 'This password is too commonly used and vulnerable. Please choose a more secure password.';
    return { valid: false, reason: msg, message: msg, score: 30, level: 'Weak', color: '#EF4444', checks };
  }

  return {
    valid: true,
    reason: undefined,
    message: 'Password meets all security criteria.',
    score,
    level,
    color,
    checks
  };
};

export default validatePassword;
