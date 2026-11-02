const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate an ephemeral high-entropy random key for local development/testing if none provided in env
const EPHEMERAL_RUNTIME_SECRET = crypto.randomBytes(32).toString('hex');

/**
 * Retrieve the active cryptographic JWT secret.
 * Enforces strict environment variable presence in production.
 */
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production') {
        if (!secret || secret.trim().length < 16) {
            console.error('[CRITICAL SECURITY ERROR] JWT_SECRET environment variable is missing or insufficiently long in production.');
            throw new Error('CRITICAL: JWT_SECRET environment variable must be configured in production.');
        }
        return secret.trim();
    }
    return (secret && secret.trim()) ? secret.trim() : EPHEMERAL_RUNTIME_SECRET;
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
    signToken,
    verifyToken
};
