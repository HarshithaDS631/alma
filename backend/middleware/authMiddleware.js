const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const connectDB = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    const authHeader = req.headers.authorization || req.headers.Authorization || req.headers.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer')) {
        try {
            await connectDB();
            token = authHeader.split(' ')[1];

            if (token) {
                try {
                    const isBlacklisted = await TokenBlacklist.findOne({ token });
                    if (isBlacklisted) {
                        return res.status(401).json({ message: 'Token has been revoked. Please log in again.' });
                    }
                } catch (e) {
                    // Ignore blacklist lookup errors on cold start
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const AdminUser = require('../models/AdminUser');
                req.user = (await User.findById(decoded.id).select('-password')) || (await AdminUser.findById(decoded.id).select('-password'));
                if (!req.user) {
                    return res.status(401).json({ message: 'User not found' });
                }
                return next();
            }
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired. Please log in again.' });
            }
            console.error('Auth error in protect middleware:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token provided' });
};

const adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

const superAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'Super Admin') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
};

// Optional protect: allows unauthenticated access (req.user will be null) but also supports auth
const optionalProtect = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer')) {
        try {
            await connectDB();
            const token = authHeader.split(' ')[1];
            if (token) {
                try {
                    const isBlacklisted = await TokenBlacklist.findOne({ token });
                    if (isBlacklisted) { return next(); }
                } catch (e) {}
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const AdminUser = require('../models/AdminUser');
                    req.user = (await User.findById(decoded.id).select('-password')) || (await AdminUser.findById(decoded.id).select('-password'));
                } catch (e) {
                    // Token invalid/expired — still allow the request through
                }
            }
        } catch (e) {}
    }
    return next();
};

module.exports = { protect, optionalProtect, adminOnly, superAdminOnly };

