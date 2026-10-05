const bcrypt = require('bcryptjs');
const PasswordHistory = require('../models/PasswordHistory');
const { validatePassword } = require('./passwordValidator');

/**
 * Validates new password against last N passwords and generates new hash
 * @param {String} userId - User ID
 * @param {String} newPlainPassword - New plain text password
 * @param {Number} [historyLimit=5] - Number of previous passwords to check
 * @returns {Promise<String>} - New password hash
 */
async function validateAndSavePassword(userId, newPlainPassword, historyLimit = 5) {
    const validation = validatePassword(newPlainPassword);
    if (!validation.valid) {
        throw new Error(validation.message);
    }

    // 1. Fetch recent password histories
    const recentHistories = await PasswordHistory.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(historyLimit);

    // 2. Check if new password matches any previous password
    for (const record of recentHistories) {
        const isMatch = await bcrypt.compare(newPlainPassword, record.passwordHash);
        if (isMatch) {
            throw new Error(`Security restriction: You cannot reuse any of your last ${historyLimit} passwords.`);
        }
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPlainPassword, salt);

    // 4. Save to history
    await PasswordHistory.create({
        user: userId,
        passwordHash: newHash
    });

    return newHash;
}

module.exports = { validateAndSavePassword };
