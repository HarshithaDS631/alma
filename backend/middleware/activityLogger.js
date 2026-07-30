const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');

/**
 * Global Activity Logger Middleware
 * Captures and logs EVERY user action (GET, POST, PUT, DELETE, etc.) into MongoDB Atlas.
 */
const activityLogger = (req, res, next) => {
    // Skip static assets or favicon to focus on API and user actions
    if (req.originalUrl.includes('/_expo') || req.originalUrl.includes('/favicon.ico')) {
        return next();
    }

    // Try extracting user ID from Authorization header if available
    let userId = req.user ? req.user._id : null;
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            if (decoded && (decoded.id || decoded._id)) {
                userId = decoded.id || decoded._id;
            }
        } catch (e) {
            // Unauthenticated or expired token
        }
    }

    // Listen for response completion to record final status code
    res.on('finish', async () => {
        try {
            const url = req.originalUrl || req.url;
            const method = req.method;

            // Determine descriptive Action Type for every small and big action
            let actionType = `${method}_ACTION`;
            if (url.includes('/api/auth/login')) actionType = 'USER_LOGIN';
            else if (url.includes('/api/auth/register')) actionType = 'USER_REGISTER';
            else if (url.includes('/api/auth/send-otp')) actionType = 'REQUEST_EMAIL_OTP';
            else if (url.includes('/api/auth/verify-otp')) actionType = 'VERIFY_EMAIL_OTP';
            else if (url.includes('/api/auth/forgot-password')) actionType = 'REQUEST_PASSWORD_RESET_LINK';
            else if (url.includes('/api/auth/reset-password')) actionType = 'PASSWORD_RESET_LINK_COMPLETED';
            else if (url.includes('/api/auth/validate-reset-token')) actionType = 'PASSWORD_RESET_LINK_ACCESSED';
            else if (url.includes('/check-match')) actionType = 'CHECK_SHEET_DATA_MATCH';
            else if (url.includes('/api/auth/google') || url.includes('oauth')) actionType = 'OAUTH_LINK_LOGIN';
            else if (url.includes('/api/auth/logout')) actionType = 'USER_LOGOUT';
            else if (url.includes('/api/auth/profile')) actionType = method === 'GET' ? 'VIEW_PROFILE' : 'UPDATE_PROFILE';
            else if (url.includes('/api/auth/directory') || url.includes('/api/auth/users')) actionType = 'SEARCH_DIRECTORY';
            else if (url.includes('/api/posts') && method === 'GET') actionType = 'VIEW_FEED';
            else if (url.includes('/api/posts') && method === 'POST') actionType = 'CREATE_POST';
            else if (url.includes('/save')) actionType = 'SAVE_POST_TOGGLE';
            else if (url.includes('/reshare')) actionType = 'RESHARE_POST';
            else if (url.includes('/like')) actionType = 'LIKE_POST_TOGGLE';
            else if (url.includes('/comment')) actionType = 'ADD_COMMENT';
            else if (url.includes('/api/jobs') && method === 'GET') actionType = 'VIEW_JOBS';
            else if (url.includes('/api/jobs') && method === 'POST') actionType = 'POST_JOB';
            else if (url.includes('/api/events') && method === 'GET') actionType = 'VIEW_EVENTS';
            else if (url.includes('/api/events') && method === 'POST') actionType = 'CREATE_EVENT';
            else if (url.includes('/api/messages')) actionType = method === 'GET' ? 'FETCH_MESSAGES' : 'SEND_MESSAGE';
            else if (url.includes('/api/notifications')) actionType = 'VIEW_NOTIFICATIONS';
            else if (url.includes('/api/upload')) actionType = 'UPLOAD_MEDIA';
            else if (url.includes('/api/admin')) actionType = `ADMIN_${method}`;
            else if (url.includes('/api/activity')) actionType = 'VIEW_ACTIVITY_LOGS';

            // Sanitize sensitive fields from metadata
            const metadata = { ...req.body, ...req.query };
            if (metadata.password) metadata.password = '***';
            if (metadata.currentPassword) metadata.currentPassword = '***';
            if (metadata.newPassword) metadata.newPassword = '***';

            const role = (req.user?.role || '').toLowerCase();
            const isSuperAdmin = role === 'super admin' || role === 'superadmin' || role === 'super_admin';
            const isAdmin = role === 'admin';

            if (isSuperAdmin) {
                const SuperAdminActivityLog = require('../models/SuperAdminActivityLog');
                await SuperAdminActivityLog.create({
                    superAdmin: userId || null,
                    superAdminEmail: req.user?.email || null,
                    superAdminName: req.user?.name || null,
                    actionType,
                    method,
                    endpoint: url,
                    metadata,
                    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1',
                    userAgent: req.get('user-agent') || 'Super Admin Dashboard',
                    status: res.statusCode
                });
            } else if (isAdmin || url.includes('/api/admin')) {
                const AdminActivityLog = require('../models/AdminActivityLog');
                await AdminActivityLog.create({
                    admin: userId || null,
                    adminEmail: req.user?.email || null,
                    adminName: req.user?.name || null,
                    actionType,
                    method,
                    endpoint: url,
                    metadata,
                    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1',
                    userAgent: req.get('user-agent') || 'Admin Dashboard',
                    status: res.statusCode
                });
            } else {
                await ActivityLog.create({
                    user: userId || null,
                    actionType,
                    method,
                    endpoint: url,
                    metadata,
                    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1',
                    userAgent: req.get('user-agent') || 'Mobile App Client',
                    status: res.statusCode
                });
            }
        } catch (error) {
            console.error('[ACTIVITY LOGGER ERROR]:', error.message);
        }
    });

    next();
};

module.exports = activityLogger;
