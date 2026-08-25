const User = require('../models/User');
const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');
const { validateAndSavePassword } = require('../utils/passwordHelper');
const { logAdminAction } = require('../services/auditLogService');

// @desc    Change password (authenticated user with 5-password history check)
// @route   POST /api/v1/password/change
// @access  Protected
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid current password' });
        }

        // Validate and save new password with history check
        const newHash = await validateAndSavePassword(user._id, newPassword, 5);
        user.password = newHash;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully with security history check applied.'
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Reset password via OTP with 5-password history check
// @route   POST /api/v1/password/reset
// @access  Public
exports.resetPasswordWithOTP = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with this email' });
        }

        // Verify OTP
        const otpRecord = await OTP.findOne({ email: email.toLowerCase().trim(), otp });
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Check password history and generate hash
        const newHash = await validateAndSavePassword(user._id, newPassword, 5);
        user.password = newHash;
        await user.save();

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        res.json({
            success: true,
            message: 'Password reset successfully with security history check applied.'
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
