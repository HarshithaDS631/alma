/**
 * Brute-Force Password Protection Middleware
 * 
 * Rules:
 * - Tracks consecutive failed password attempts per IP and per (IP + Email).
 * - Threshold: 5 failed attempts (configurable up to 7).
 * - Lockout: Blocks login for 10 minutes ("block for few minutes") upon reaching 5 failed attempts.
 * - Progressive Defense:
 *     - Attempt 1-2: Standard authentication.
 *     - Attempt 3-4: Issues warning and triggers CAPTCHA requirement.
 *     - Attempt 5: Blocks client/account for 10 minutes (HTTP 423/429) with real-time countdown.
 */

const MAX_FAILED_ATTEMPTS = 5; // User requirement: 5 to 7 attempts
const BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes block
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 minutes tracking window

// In-memory store: key -> { count: number, firstAttemptAt: number, blockedUntil: number | null }
const attemptsStore = new Map();

// Periodic cleanup of stale entries every 2 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attemptsStore.entries()) {
        const isExpiredBlock = record.blockedUntil && record.blockedUntil <= now;
        const isExpiredWindow = now - record.firstAttemptAt > WINDOW_DURATION_MS && !record.blockedUntil;
        if (isExpiredBlock || isExpiredWindow) {
            attemptsStore.delete(key);
        }
    }
}, 2 * 60 * 1000).unref();

function getStoreKey(ip, email = '') {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    return cleanEmail ? `${ip}::${cleanEmail}` : `ip::${ip}`;
}

/**
 * Check if the given IP or email is currently blocked
 */
function getBlockStatus(ip, email = '') {
    const now = Date.now();
    const keysToCheck = [getStoreKey(ip, email), getStoreKey(ip, '')];

    for (const key of keysToCheck) {
        const record = attemptsStore.get(key);
        if (record && record.blockedUntil && record.blockedUntil > now) {
            const remainingMs = record.blockedUntil - now;
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
            return {
                isBlocked: true,
                remainingSeconds,
                remainingMinutes,
                blockedUntil: new Date(record.blockedUntil).toISOString(),
                failedAttempts: record.count
            };
        }
    }

    return { isBlocked: false, remainingSeconds: 0, remainingMinutes: 0 };
}

/**
 * Check if CAPTCHA is required for this IP/Email
 */
function isCaptchaRequired(ip, email = '') {
    const keysToCheck = [getStoreKey(ip, email), getStoreKey(ip, '')];
    for (const key of keysToCheck) {
        const record = attemptsStore.get(key);
        if (record && record.count >= 2) {
            return true;
        }
    }
    return false;
}

/**
 * Record a failed password attempt
 */
function recordFailedAttempt(ip, email = '') {
    const now = Date.now();
    const keys = [getStoreKey(ip, email), getStoreKey(ip, '')];

    let result = null;

    for (const key of keys) {
        let record = attemptsStore.get(key);
        if (!record || (now - record.firstAttemptAt > WINDOW_DURATION_MS && (!record.blockedUntil || record.blockedUntil <= now))) {
            record = {
                count: 1,
                firstAttemptAt: now,
                blockedUntil: null
            };
        } else {
            record.count += 1;
        }

        // Lock if reached threshold (5 to 7 attempts)
        if (record.count >= MAX_FAILED_ATTEMPTS) {
            record.blockedUntil = now + BLOCK_DURATION_MS;
        }

        attemptsStore.set(key, record);

        if (!result && record.blockedUntil && record.blockedUntil > now) {
            const remainingMs = record.blockedUntil - now;
            result = {
                isBlocked: true,
                remainingSeconds: Math.ceil(remainingMs / 1000),
                remainingMinutes: Math.ceil(remainingMs / (60 * 1000)),
                failedAttempts: record.count,
                blockedUntil: new Date(record.blockedUntil).toISOString()
            };
        }
    }

    const specificRecord = attemptsStore.get(getStoreKey(ip, email)) || attemptsStore.get(getStoreKey(ip, ''));
    return result || {
        isBlocked: false,
        failedAttempts: specificRecord ? specificRecord.count : 1,
        requiresCaptcha: specificRecord ? specificRecord.count >= 2 : false
    };
}

/**
 * Record a successful login - resets the failed attempts
 */
function recordSuccessfulLogin(ip, email = '') {
    attemptsStore.delete(getStoreKey(ip, email));
    const ipRecord = attemptsStore.get(getStoreKey(ip, ''));
    if (ipRecord) {
        ipRecord.count = Math.max(0, ipRecord.count - 3);
        if (ipRecord.count < MAX_FAILED_ATTEMPTS) {
            ipRecord.blockedUntil = null;
        }
        if (ipRecord.count === 0) {
            attemptsStore.delete(getStoreKey(ip, ''));
        }
    }
}

/**
 * Express middleware to guard routes against brute-force attacks
 */
function bruteForceLoginGuard(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const email = req.body?.email || '';

    const blockStatus = getBlockStatus(ip, email);

    if (blockStatus.isBlocked) {
        res.setHeader('Retry-After', blockStatus.remainingSeconds);
        return res.status(423).json({
            isBlocked: true,
            accountLocked: true,
            message: `Too many failed password attempts. Access is temporarily blocked for ${blockStatus.remainingMinutes} minute(s) to protect your account. Please try again later or reset your password.`,
            remainingMinutes: blockStatus.remainingMinutes,
            remainingSeconds: blockStatus.remainingSeconds,
            blockedUntil: blockStatus.blockedUntil,
            requiresCaptcha: true
        });
    }

    req.bruteForce = {
        requiresCaptcha: isCaptchaRequired(ip, email)
    };

    next();
}

module.exports = {
    bruteForceLoginGuard,
    recordFailedAttempt,
    recordSuccessfulLogin,
    getBlockStatus,
    isCaptchaRequired,
    MAX_FAILED_ATTEMPTS,
    BLOCK_DURATION_MS
};
