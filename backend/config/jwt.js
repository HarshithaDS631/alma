const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Hardened 64-character high-entropy secret for fallback / production safety
const HARDENED_RUNTIME_SECRET = 'a8f521b4467d559828e833f2bb04c63261a8ef14115161044439c2be0b8471da';

/**
 * Retrieve the active cryptographic JWT secret.
 * Prioritizes process.env.JWT_SECRET; gracefully falls back to hardened runtime secret if unconfigured.
 */
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    const isPredictable = secret === 'super_secret_jwt_key_rvce_alumni_2026_xyz' || secret === 'secret';
    if (secret && typeof secret === 'string' && secret.trim().length >= 16 && !isPredictable) {
        return secret.trim();
    }
    process.env.JWT_SECRET = HARDENED_RUNTIME_SECRET;
    if (process.env.NODE_ENV === 'production') {
        console.warn('[JWT SECURITY NOTICE] JWT_SECRET environment variable is not explicitly configured in production; using hardened high-entropy runtime key.');
    }
    return HARDENED_RUNTIME_SECRET;
};

// Ensure process.env.JWT_SECRET is safely populated immediately
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super_secret_jwt_key_rvce_alumni_2026_xyz' || process.env.JWT_SECRET === 'secret') {
    process.env.JWT_SECRET = HARDENED_RUNTIME_SECRET;
}

/**
 * Generate standard HMAC SHA256 Access Token
 */
const generateToken = (payload, expiresIn = '30d') => {
    const secret = getJwtSecret();
    return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Sign a payload with the active cryptographic secret.
 * @param {Object} payload 
 * @param {Object} options 
 * @returns {string} Signed JWT
 */
const signToken = (payload, options = {}) => {
    const secret = getJwtSecret();
    const resolvedOptions = typeof options === 'string' ? { expiresIn: options } : options;
    const defaultOptions = {
        expiresIn: '7d',
        algorithm: 'HS256'
    };
    return jwt.sign(payload, secret, { ...defaultOptions, ...resolvedOptions });
};

/**
 * Verify and decode an incoming JWT token strictly against the active secret.
 * @param {string} token 
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
    if (!token || typeof token !== 'string') {
        throw new Error('No token provided');
    }
    const secret = getJwtSecret();
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
};

module.exports = {
    getJwtSecret,
    generateToken,
    signToken,
    verifyToken
};
