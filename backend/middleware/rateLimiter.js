const rateLimit = require('express-rate-limit');

// General API rate limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    // Skip rate limiting in test/development if needed
    skip: () => process.env.NODE_ENV === 'test'
});

// Strict rate limiter for login: 30 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    // Use default IP-based key generator (handles IPv6 properly)
    validate: { xForwardedForHeader: false }
});

// OTP rate limiter: 3 OTP requests per 10 minutes
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many OTP requests. Please try again after 10 minutes.'
    }
});

// Password reset rate limiter: 3 requests per 30 minutes
const passwordResetLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many password reset attempts. Please try again after 30 minutes.'
    }
});

module.exports = { apiLimiter, authLimiter, otpLimiter, passwordResetLimiter };
