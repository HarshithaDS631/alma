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

    // 4. Daily SAP SLcM Delta Sync (Scheduled for 02:00 AM IST)
    let lastSapSyncDate = null;
    setInterval(async () => {
        try {
            const now = new Date();
            // Calculate IST hour (UTC + 5:30)
            const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
            const todayStr = now.toISOString().slice(0, 10);

            if (istHours === 2 && lastSapSyncDate !== todayStr) {
                lastSapSyncDate = todayStr;
                const sapService = require('../services/sapService');
                if (sapService.isConfigured()) {
                    console.log('[Scheduler] Starting automated 02:00 AM SAP SLcM delta sync...');
                    const currentYear = String(now.getFullYear());
                    const syncResult = await sapService.syncGraduatedBatchFromSAP(currentYear);
                    console.log(`[Scheduler] Automated SAP SLcM sync completed: ${syncResult.count} records updated.`);
                }
            }
        } catch (err) {
            console.warn('[Scheduler SAP Sync Notice]:', err.message);
        }
    }, 1800000); // Check every 30 minutes
}

module.exports = { initScheduler };
