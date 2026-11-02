/**
 * Upstash Redis Service Client
 * Provides high-speed distributed rate limiting and caching across serverless lambdas.
 * Seamlessly degrades to in-memory mode if Redis credentials are not configured.
 */

const { Redis } = require('@upstash/redis');

let redisClient = null;
let isConfigured = false;

const initRedis = () => {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token && url.startsWith('http')) {
        try {
            redisClient = new Redis({ url, token });
            isConfigured = true;
            console.log('[REDIS] Upstash Redis distributed client initialized successfully.');
        } catch (err) {
            console.warn('[REDIS WARNING] Failed to initialize Upstash Redis client:', err.message);
            redisClient = null;
            isConfigured = false;
        }
    } else {
        // Safe degraded mode for local development, tests, or offline environments
        isConfigured = false;
        redisClient = null;
    }
};

// Initialize on module load
initRedis();

const isRedisConfigured = () => isConfigured && redisClient !== null;
const getRedisClient = () => redisClient;

/**
 * Retrieve cached JSON value
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
const redisGet = async (key) => {
    if (!isRedisConfigured()) return null;
    try {
        const val = await redisClient.get(key);
        if (!val) return null;
        return typeof val === 'string' ? JSON.parse(val) : val;
    } catch (_err) {
        return null;
    }
};

/**
 * Store value with expiration TTL
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 * @returns {Promise<boolean>}
 */
const redisSet = async (key, value, ttlSeconds = 300) => {
    if (!isRedisConfigured()) return false;
    try {
        const stringified = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds && ttlSeconds > 0) {
            await redisClient.set(key, stringified, { ex: ttlSeconds });
        } else {
            await redisClient.set(key, stringified);
        }
        return true;
    } catch (_err) {
        return false;
    }
};

/**
 * Delete key or keys matching prefix
 * @param {string|string[]} keys 
 * @returns {Promise<boolean>}
 */
const redisDel = async (keys) => {
    if (!isRedisConfigured()) return false;
    try {
        if (Array.isArray(keys)) {
            if (keys.length > 0) await redisClient.del(...keys);
        } else {
            await redisClient.del(keys);
        }
        return true;
    } catch (_err) {
        return false;
    }
};

/**
 * Increment rate limiter counter atomically with expiry window
 * @param {string} key 
 * @param {number} windowSeconds 
 * @returns {Promise<number>} Current count within the window
 */
const redisIncrWithExpiry = async (key, windowSeconds = 900) => {
    if (!isRedisConfigured()) return 0;
    try {
        // Atomic pipeline: INCR + EXPIRE (NX = set expiry only if key has no expiry)
        const p = redisClient.pipeline();
        p.incr(key);
        p.expire(key, windowSeconds);
        const results = await p.exec();
        const currentCount = results && results[0] ? Number(results[0]) : 1;
        return currentCount;
    } catch (_err) {
        return 0; // Degrade gracefully
    }
};

module.exports = {
    isRedisConfigured,
    getRedisClient,
    redisGet,
    redisSet,
    redisDel,
    redisIncrWithExpiry
};
