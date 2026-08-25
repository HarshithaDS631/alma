const AuditLog = require('../models/AuditLog');

/**
 * Log administrative operations to the AuditLog collection
 * @param {Object} params
 * @param {Object|String} params.actor User object or User ID
 * @param {String} params.actorRole Role of the actor ('SUPER_ADMIN', 'INSTITUTION_ADMIN', 'SYSTEM')
 * @param {String} [params.institution] Institution ID
 * @param {String} params.action Audit action name
 * @param {String} [params.targetId] Target entity ID
 * @param {String} [params.targetType] Target entity Type ('User', 'Institution', 'Department', 'Post', etc.)
 * @param {Object} [params.req] Express request object to extract IP and user agent
 * @param {Object} [params.metadata] Additional key-value details
 */
async function logAdminAction({
    actor,
    actorRole,
    institution = null,
    action,
    targetId = null,
    targetType = null,
    req = null,
    metadata = {}
}) {
    try {
        const actorId = actor?._id || actor;
        const normalizedRole = actorRole || (actor?.role?.toUpperCase().replace(/\s+/g, '_') || 'INSTITUTION_ADMIN');
        
        const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip || '';
        const userAgent = req?.headers['user-agent'] || '';

        const logEntry = new AuditLog({
            actor: actorId,
            actorRole: normalizedRole,
            institution: institution || actor?.institution || null,
            action,
            targetId,
            targetType,
            ipAddress,
            userAgent,
            metadata
        });

        await logEntry.save();
        return logEntry;
    } catch (err) {
        console.error('[AuditLog Error]: Failed to write audit record:', err.message);
        // Non-blocking: don't crash request flow if audit write fails
        return null;
    }
}

module.exports = { logAdminAction };
