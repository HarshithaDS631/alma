const rateLimit = require('express-rate-limit');
const { isRedisConfigured, redisIncrWithExpiry } = require('../services/redisService');

// Helper to reliably extract client IP across reverse proxies (e.g. Vercel, Nginx)
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || (req.connection && req.connection.remoteAddress) || '127.0.0.1';
};

/**
 * Creates a hybrid rate limiter:
 * Uses distributed Upstash Redis when configured across serverless lambdas.
 * Degrades gracefully to in-memory express-rate-limit when offline or unconfigured.
 */
const createHybridLimiter = ({ prefix, windowMs, max, message }) => {
    const memoryLimiter = rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        validate: { keyGeneratorIpFallback: false },
        keyGenerator: getClientIp,
        message,
        skip: () => process.env.NODE_ENV === 'test'
    });

    const windowSeconds = Math.ceil(windowMs / 1000);

    return async (req, res, next) => {
        // Bypass in test mode
        if (process.env.NODE_ENV === 'test') {
            return next();
        }

        if (isRedisConfigured()) {
            try {
                const ip = getClientIp(req);
                const redisKey = `ratelimit:${prefix}:${ip}`;
                const currentCount = await redisIncrWithExpiry(redisKey, windowSeconds);

                if (currentCount > 0) {
                    res.setHeader('RateLimit-Limit', String(max));
                    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - currentCount)));

                    if (currentCount > max) {
                        res.setHeader('Retry-After', String(windowSeconds));
                        return res.status(429).json(message);
                    }
                    return next();
                }
            } catch (err) {
                console.warn('[REDIS RATELIMIT WARNING] Error querying distributed counter, falling back to memory store:', err.message);
            }
        }

        // Fallback to local memory limiter
        return memoryLimiter(req, res, next);
    };
};

// General API rate limiter: 200 requests per 15 minutes per IP
const apiLimiter = createHybridLimiter({
    prefix: 'api',
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});

// Rate limiter for authentication endpoints: 60 attempts per 15 minutes per IP
const authLimiter = createHybridLimiter({
    prefix: 'auth',
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: {
        message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
});

// OTP rate limiter: 5 OTP requests per 10 minutes
const otpLimiter = createHybridLimiter({
    prefix: 'otp',
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        message: 'Too many OTP requests. Please try again after 10 minutes.'
    }
});

// Password reset rate limiter: 5 requests per 30 minutes
const passwordResetLimiter = createHybridLimiter({
    prefix: 'pwd_reset',
    windowMs: 30 * 60 * 1000,
    max: 5,
    message: {
        message: 'Too many password reset attempts. Please try again after 30 minutes.'
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
    otpLimiter,
    passwordResetLimiter,
    getClientIp,
    createHybridLimiter
};
