const crypto = require('crypto');
const UserSession = require('../models/UserSession');
const AdminSession = require('../models/AdminSession');
const SuperAdminSession = require('../models/SuperAdminSession');

/**
 * Extract clean client IP Address across proxy layers (Vercel, Cloudflare, etc.)
 */
const getClientIp = (req) => {
    if (!req) return '127.0.0.1';
    const xForwarded = req.headers ? (req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For']) : null;
    if (xForwarded && typeof xForwarded === 'string') {
        return xForwarded.split(',')[0].trim();
    }
    const realIp = req.headers ? (req.headers['x-real-ip'] || req.headers['X-Real-IP']) : null;
    if (realIp && typeof realIp === 'string') {
        return realIp.trim();
    }
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
};

/**
 * Record Session Login in respective collection:
 * - Super Admin -> superadminsessions
 * - Admin -> adminsessions
 * - User -> usersessions
 */
const recordSessionLogin = async (req, user) => {
    try {
        if (!user) return null;
        const sessionId = `sess_${crypto.randomBytes(12).toString('hex')}`;
        const ipAddress = getClientIp(req);
        const userAgent = req.get ? (req.get('user-agent') || 'Mobile App / Web Browser') : 'Unknown';
        const role = (user.role || '').toLowerCase();

        const isSuperAdmin = role === 'super admin' || role === 'superadmin' || role === 'super_admin';
        const isAdmin = role === 'admin';

        if (isSuperAdmin) {
            const session = await SuperAdminSession.create({
                sessionId,
                superAdmin: user._id,
                superAdminEmail: user.email,
                superAdminName: user.name || 'Super Admin',
                ipAddress,
                userAgent,
                loginTime: new Date(),
                status: 'active'
            });
            console.log(`[Session Tracking] Registered Super Admin login session (${sessionId}) for ${user.email} from IP: ${ipAddress}`);
            return session;
        } else if (isAdmin) {
            const session = await AdminSession.create({
                sessionId,
                admin: user._id,
                adminEmail: user.email,
                adminName: user.name || 'Admin',
                ipAddress,
                userAgent,
                loginTime: new Date(),
                status: 'active'
            });
            console.log(`[Session Tracking] Registered Admin login session (${sessionId}) for ${user.email} from IP: ${ipAddress}`);
            return session;
        } else {
            const session = await UserSession.create({
                sessionId,
                user: user._id,
                userEmail: user.email,
                userName: user.name || 'User',
                ipAddress,
                userAgent,
                loginTime: new Date(),
                status: 'active'
            });
            console.log(`[Session Tracking] Registered User login session (${sessionId}) for ${user.email} from IP: ${ipAddress}`);
            return session;
        }
    } catch (err) {
        console.error('[Session Login Tracker Error]:', err.message);
        return null;
    }
};

/**
 * Record Session Logout in respective collection:
 * - Updates logoutTime, status='logged_out', and computes durationSeconds
 */
const recordSessionLogout = async (req, user) => {
    try {
        if (!user) return null;
        const role = (user.role || '').toLowerCase();
        const isSuperAdmin = role === 'super admin' || role === 'superadmin' || role === 'super_admin';
        const isAdmin = role === 'admin';
        const logoutTime = new Date();

        if (isSuperAdmin) {
            const activeSession = await SuperAdminSession.findOne({ superAdmin: user._id, status: 'active' }).sort({ loginTime: -1 });
            if (activeSession) {
                activeSession.logoutTime = logoutTime;
                activeSession.status = 'logged_out';
                activeSession.durationSeconds = Math.round((logoutTime - activeSession.loginTime) / 1000);
                await activeSession.save();
                console.log(`[Session Tracking] Registered Super Admin logout for ${user.email}. Duration: ${activeSession.durationSeconds}s`);
                return activeSession;
            }
        } else if (isAdmin) {
            const activeSession = await AdminSession.findOne({ admin: user._id, status: 'active' }).sort({ loginTime: -1 });
            if (activeSession) {
                activeSession.logoutTime = logoutTime;
                activeSession.status = 'logged_out';
                activeSession.durationSeconds = Math.round((logoutTime - activeSession.loginTime) / 1000);
                await activeSession.save();
                console.log(`[Session Tracking] Registered Admin logout for ${user.email}. Duration: ${activeSession.durationSeconds}s`);
                return activeSession;
            }
        } else {
            const activeSession = await UserSession.findOne({ user: user._id, status: 'active' }).sort({ loginTime: -1 });
            if (activeSession) {
                activeSession.logoutTime = logoutTime;
                activeSession.status = 'logged_out';
                activeSession.durationSeconds = Math.round((logoutTime - activeSession.loginTime) / 1000);
                await activeSession.save();
                console.log(`[Session Tracking] Registered User logout for ${user.email}. Duration: ${activeSession.durationSeconds}s`);
                return activeSession;
            }
        }
    } catch (err) {
        console.error('[Session Logout Tracker Error]:', err.message);
        return null;
    }
};

module.exports = {
    getClientIp,
    recordSessionLogin,
    recordSessionLogout
};
