/**
 * High-Performance Read-Through Cache Middleware
 * Caches GET responses in Upstash Redis to deliver sub-50ms response times.
 * Bypasses cleanly without errors when Redis is unconfigured.
 */

const { isRedisConfigured, redisGet, redisSet, redisDel } = require('../services/redisService');

/**
 * Creates an Express middleware to cache GET endpoint responses.
 * @param {number} ttlSeconds Time-to-live in seconds (default: 300 = 5 minutes)
 * @param {string} keyPrefix Namespace prefix for keys
 */
const cacheMiddleware = (ttlSeconds = 300, keyPrefix = 'cache') => {
    return async (req, res, next) => {
        // Only cache idempotent GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Bypass caching if Redis is not configured or in test mode
        if (!isRedisConfigured() || process.env.NODE_ENV === 'test') {
            return next();
        }

        try {
            // Build deterministic cache key including user tenant/institution if present
            const tenant = req.user?.institution || 'global';
            const queryParams = Object.keys(req.query || {}).sort().map(k => `${k}=${req.query[k]}`).join('&');
            const cacheKey = `${keyPrefix}:${req.baseUrl || ''}${req.path}:${tenant}:${queryParams}`;

            const cachedData = await redisGet(cacheKey);

            if (cachedData !== null && cachedData !== undefined) {
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Cache-TTL', String(ttlSeconds));
                return res.json(cachedData);
            }

            res.setHeader('X-Cache', 'MISS');

            // Intercept res.json to populate cache on miss
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // Only cache successful 200 responses
                if (res.statusCode === 200 && body) {
                    redisSet(cacheKey, body, ttlSeconds).catch(err => {
                        console.warn('[CACHE WRITE WARNING]:', err.message);
                    });
                }
                return originalJson(body);
            };

            return next();
        } catch (err) {
            console.warn('[CACHE MIDDLEWARE WARNING]:', err.message);
            return next();
        }
    };
};

/**
 * Invalidate cached items by key or array of keys
 * @param {string|string[]} keys 
 */
const invalidateCache = async (keys) => {
    if (!isRedisConfigured()) return;
    try {
        await redisDel(keys);
    } catch (err) {
        console.warn('[CACHE INVALIDATION ERROR]:', err.message);
    }
};

module.exports = { cacheMiddleware, invalidateCache };

