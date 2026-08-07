const OTP = require('../models/OTP');
const TokenBlacklist = require('../models/TokenBlacklist');
const RefreshToken = require('../models/RefreshToken');

/**
 * Initializes background cron/interval tasks for data retention, cleanup, and email reminders.
 */
function initScheduler() {
    console.log('[Scheduler] Initializing automated background cleanup & report tasks...');

    // Run cleanup every 1 hour (3600000 ms)
    setInterval(async () => {
        try {
            const now = new Date();

            // 1. Delete Expired OTPs
            const otpResult = await OTP.deleteMany({ expiresAt: { $lt: now } });
            if (otpResult.deletedCount > 0) {
                console.log(`[Scheduler Cleanup] Removed ${otpResult.deletedCount} expired OTP documents.`);
            }

            // 2. Delete Expired Blacklisted Tokens
            const tokenResult = await TokenBlacklist.deleteMany({ expiresAt: { $lt: now } });
            if (tokenResult.deletedCount > 0) {
                console.log(`[Scheduler Cleanup] Removed ${tokenResult.deletedCount} expired blacklisted token records.`);
            }

            // 3. Delete Expired Refresh Tokens
            const refreshResult = await RefreshToken.deleteMany({ expiresAt: { $lt: now } });
            if (refreshResult.deletedCount > 0) {
                console.log(`[Scheduler Cleanup] Removed ${refreshResult.deletedCount} expired refresh tokens.`);
            }

        } catch (error) {
            console.error('[Scheduler Error]:', error.message);
        }
    }, 3600000); // 1 hour interval
}

module.exports = { initScheduler };
