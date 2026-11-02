const rateLimit = require('express-rate-limit');

// Helper to reliably extract client IP across reverse proxies (e.g. Vercel, Nginx)
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || (req.connection && req.connection.remoteAddress) || '127.0.0.1';
};

// General API rate limiter: 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIp,
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    skip: () => process.env.NODE_ENV === 'test'
});

// Rate limiter for authentication endpoints: 60 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIp,
    message: {
        message: 'Too many authentication attempts. Please try again after 15 minutes.'
    },
    skip: () => process.env.NODE_ENV === 'test'
});

// OTP rate limiter: 5 OTP requests per 10 minutes
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIp,
    message: {
        message: 'Too many OTP requests. Please try again after 10 minutes.'
    },
    skip: () => process.env.NODE_ENV === 'test'
});

// Password reset rate limiter: 5 requests per 30 minutes
const passwordResetLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIp,
    message: {
        message: 'Too many password reset attempts. Please try again after 30 minutes.'
    },
    skip: () => process.env.NODE_ENV === 'test'
});

module.exports = { apiLimiter, authLimiter, otpLimiter, passwordResetLimiter, getClientIp };
