/**
 * Enterprise Password Validator Utility
 * Enforces institutional grade security for all user and admin passwords.
 */

// Common weak / compromised passwords to explicitly reject
const COMMON_WEAK_PASSWORDS = new Set([
    'password', 'password123', 'admin123', 'admin@123', 'qwerty123',
    '12345678', '123456789', '1234567890', 'alumni123', 'rvce123',
    'welcome123', 'pass1234', 'iloveyou', 'sunshine', 'princess',
    'football', 'monkey123', 'dragon123', 'master123', 'trustno1'
]);

const PASSWORD_POLICY_DESCRIPTION = 
    'Password must be at least 8 characters long, contain at least one uppercase letter (A-Z), ' +
    'one lowercase letter (a-z), one numeric digit (0-9), and one special character (!@#$%^&*...).';

/**
 * Validates password against enterprise complexity standards
 * @param {string} password - Plain text password
 * @returns {{ valid: boolean, message: string, score: number, checks: object }}
 */
function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return {
            valid: false,
            message: 'Password is required and must be a text string.',
            score: 0,
            checks: { minLength: false, uppercase: false, lowercase: false, number: false, special: false, notCommon: false, noSpaces: false }
        };
    }

    const trimmed = password.trim();
    if (trimmed.length !== password.length) {
        return {
            valid: false,
            message: 'Password must not contain leading or trailing spaces.',
            score: 0,
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

    if (!checks.minLength) {
        return {
            valid: false,
            message: password.length < 8 ? 'Password must be at least 8 characters long.' : 'Password must be at most 128 characters.',
            score,
            checks
        };
    }

    if (!checks.noSpaces) {
        return {
            valid: false,
            message: 'Password cannot contain whitespace characters.',
            score,
            checks
        };
    }

    if (!checks.uppercase) {
        return {
            valid: false,
            message: 'Password must contain at least one uppercase letter (A-Z).',
            score,
            checks
        };
    }

    if (!checks.lowercase) {
        return {
            valid: false,
            message: 'Password must contain at least one lowercase letter (a-z).',
            score,
            checks
        };
    }

    if (!checks.number) {
        return {
            valid: false,
            message: 'Password must contain at least one numeric digit (0-9).',
            score,
            checks
        };
    }

    if (!checks.special) {
        return {
            valid: false,
            message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>...).',
            score,
            checks
        };
    }

    if (!checks.notCommon) {
        return {
            valid: false,
            message: 'This password is too commonly used and vulnerable. Please choose a more secure password.',
            score: Math.min(score, 40),
            checks
        };
    }

    return {
        valid: true,
        message: 'Password meets all security criteria.',
        score,
        checks
    };
}

module.exports = {
    validatePassword,
    PASSWORD_POLICY_DESCRIPTION,
    COMMON_WEAK_PASSWORDS
};
