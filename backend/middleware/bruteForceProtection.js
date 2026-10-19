/**
 * Enterprise Brute-Force & Distributed "Group-Force" Defense Middleware
 * 
 * Rules:
 * 1. Single IP Defense:
 *    - Tracks consecutive failed password attempts per IP and per (IP + Email).
 *    - Threshold: 5 failed attempts -> 10 minutes block.
 * 2. Distributed "Group-Force" & Credential Stuffing Defense:
 *    - Tracks failed attempts globally per Account (email) across all rotating botnet IPs.
 *    - Threshold: 5 failed attempts across ANY IPs -> Locks account for 10 minutes.
 * 3. Subnet Group Defense:
 *    - Groups IPs by /24 subnet (e.g. 192.168.1.* or 45.33.32.*).
 *    - Threshold: 8 failed attempts within a subnet group -> 10 minutes block for the subnet.
 * 4. Coordinated Group Attack Velocity Guard:
 *    - Monitors total system-wide authentication failure velocity in the last 60 seconds.
 *    - If >= 15 failures occur within 60 seconds across the platform, Global Anti-Bot Alert mode activates,
 *      enforcing CAPTCHA on all authentication attempts platform-wide.
 */

const MAX_FAILED_ATTEMPTS = 5; // 5 to 7 attempts threshold
const SUBNET_FAILED_ATTEMPTS = 8; // Subnet group threshold
const BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes block
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 minutes tracking window
const GLOBAL_VELOCITY_WINDOW_MS = 60 * 1000; // 60 seconds sliding window
const GLOBAL_ATTACK_THRESHOLD = 15; // 15 failures in 60s triggers global defense

// Store for IP, Account, and Subnet attempts: key -> { count, firstAttemptAt, blockedUntil }
const attemptsStore = new Map();

// Store for global timestamps of failed attempts
const globalFailedTimestamps = [];

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

    // Cleanup global timestamps older than sliding window
    while (globalFailedTimestamps.length > 0 && globalFailedTimestamps[0] < now - GLOBAL_VELOCITY_WINDOW_MS) {
        globalFailedTimestamps.shift();
    }
}, 2 * 60 * 1000).unref();

/**
 * Extract /24 subnet from IPv4 or /64 prefix from IPv6
 */
function getSubnetKey(ip) {
    if (!ip || ip === 'unknown') return 'subnet::unknown';
    // IPv4 check
    if (ip.includes('.')) {
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `subnet::${parts[0]}.${parts[1]}.${parts[2]}`;
        }
    }
    // IPv6 or fallback
    return `subnet::${ip.slice(0, 16)}`;
}

function getStoreKeys(ip, email = '') {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const keys = [];

    // 1. IP + Email specific key
    if (cleanEmail && ip) {
        keys.push({ key: `${ip}::${cleanEmail}`, limit: MAX_FAILED_ATTEMPTS, type: 'account_ip' });
    }

    // 2. Account-wide key (protects against distributed / group botnet attacks across rotating IPs)
    if (cleanEmail) {
        keys.push({ key: `account::${cleanEmail}`, limit: MAX_FAILED_ATTEMPTS, type: 'account_global' });
    }

    // 3. IP key
    if (ip) {
        keys.push({ key: `ip::${ip}`, limit: MAX_FAILED_ATTEMPTS, type: 'ip' });
    }

    // 4. Subnet key (detects group botnets operating from same datacenter or IP block)
    if (ip) {
        keys.push({ key: getSubnetKey(ip), limit: SUBNET_FAILED_ATTEMPTS, type: 'subnet' });
    }

    return keys;
}

/**
 * Check if the platform is currently under a high-velocity coordinated attack
 */
function isUnderGlobalAttack() {
    const now = Date.now();
    const recent = globalFailedTimestamps.filter(t => t > now - GLOBAL_VELOCITY_WINDOW_MS);
    return recent.length >= GLOBAL_ATTACK_THRESHOLD;
}

/**
 * Check if the given IP, Subnet, or Account is currently blocked
 */
function getBlockStatus(ip, email = '') {
    const now = Date.now();
    const keyConfigs = getStoreKeys(ip, email);

    for (const { key, type } of keyConfigs) {
        const record = attemptsStore.get(key);
        if (record && record.blockedUntil && record.blockedUntil > now) {
            const remainingMs = record.blockedUntil - now;
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
            
            let blockReason = 'Access is temporarily blocked due to repeated password attempts.';
            if (type === 'account_global') {
                blockReason = 'This account has been temporarily locked due to multiple consecutive failed attempts across multiple locations.';
            } else if (type === 'subnet') {
                blockReason = 'Access from this network group has been temporarily restricted due to excessive authentication failures.';
            }

            return {
                isBlocked: true,
                remainingSeconds,
                remainingMinutes,
                blockedUntil: new Date(record.blockedUntil).toISOString(),
                failedAttempts: record.count,
                blockType: type,
                blockReason
            };
        }
    }

    return { isBlocked: false, remainingSeconds: 0, remainingMinutes: 0 };
}

/**
 * Check if CAPTCHA is required for this IP, Subnet, or Account
 */
function isCaptchaRequired(ip, email = '') {
    // If under platform-wide coordinated group attack, require CAPTCHA for everyone
    if (isUnderGlobalAttack()) {
        return true;
    }

    const keyConfigs = getStoreKeys(ip, email);
    for (const { key } of keyConfigs) {
        const record = attemptsStore.get(key);
        if (record && record.count >= 2) {
            return true;
        }
    }
    return false;
}

/**
 * Record a failed password attempt across IP, Account, Subnet, and Global velocity
 */
function recordFailedAttempt(ip, email = '') {
    const now = Date.now();
    globalFailedTimestamps.push(now);

    const keyConfigs = getStoreKeys(ip, email);
    let result = null;

    for (const { key, limit, type } of keyConfigs) {
        let record = attemptsStore.get(key);
        if (!record || (now - record.firstAttemptAt > WINDOW_DURATION_MS && (!record.blockedUntil || record.blockedUntil <= now))) {
            record = {
                count: 1,
                firstAttemptAt: now,
                blockedUntil: null,
                type
            };
        } else {
            record.count += 1;
        }

        // Lock if reached threshold
        if (record.count >= limit) {
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
                blockedUntil: new Date(record.blockedUntil).toISOString(),
                blockType: type
            };
        }
    }

    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const specificRecord = attemptsStore.get(`${ip}::${cleanEmail}`) || attemptsStore.get(`account::${cleanEmail}`) || attemptsStore.get(`ip::${ip}`);

    return result || {
        isBlocked: false,
        failedAttempts: specificRecord ? specificRecord.count : 1,
        requiresCaptcha: isCaptchaRequired(ip, email)
    };
}

/**
 * Record a successful login - resets the failed attempts for this user and IP
 */
function recordSuccessfulLogin(ip, email = '') {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    if (cleanEmail) {
        attemptsStore.delete(`account::${cleanEmail}`);
        attemptsStore.delete(`${ip}::${cleanEmail}`);
    }

    const ipRecord = attemptsStore.get(`ip::${ip}`);
    if (ipRecord) {
        ipRecord.count = Math.max(0, ipRecord.count - 3);
        if (ipRecord.count < MAX_FAILED_ATTEMPTS) {
            ipRecord.blockedUntil = null;
        }
        if (ipRecord.count === 0) {
            attemptsStore.delete(`ip::${ip}`);
        }
    }

    const subnetKey = getSubnetKey(ip);
    const subnetRecord = attemptsStore.get(subnetKey);
    if (subnetRecord) {
        subnetRecord.count = Math.max(0, subnetRecord.count - 2);
        if (subnetRecord.count < SUBNET_FAILED_ATTEMPTS) {
            subnetRecord.blockedUntil = null;
        }
        if (subnetRecord.count === 0) {
            attemptsStore.delete(subnetKey);
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
            message: `${blockStatus.blockReason || 'Too many failed password attempts.'} Access is temporarily blocked for ${blockStatus.remainingMinutes} minute(s) to protect your account. Please try again later or reset your password.`,
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
    isUnderGlobalAttack,
    MAX_FAILED_ATTEMPTS,
    BLOCK_DURATION_MS
};
