const express = require('express');
const { 
    registerUser, 
    loginUser, 
    logoutUser,
    updateUserProfile, 
    getUsers, 
    getSuggestions,
    sendOtp,
    verifyOtp,
    oauthLogin, 
    linkedinAuthCallback,
    checkEmailExists,
    getProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    deleteAccount,
    toggleFollow,
    getFollowers,
    getFollowing,
    getNotifications,
    markNotificationsRead,
    getLoginHistory,
    googleAuth,
    linkedinAuth,
    facebookAuth,
    refreshAccessToken,
    setup2FA,
    verify2FA,
    loginVerify2FA,
    disable2FA,
    getActiveSessions,
    revokeSession,
    sendConnectionRequest,
    getConnectionRequests,
    acceptConnectionRequest,
    declineConnectionRequest
} = require('../controllers/authController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { authLimiter, otpLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { loginValidation, registerValidation, otpValidation, forgotPasswordValidation, profileUpdateValidation, changePasswordValidation } = require('../middleware/requestValidator');
const router = express.Router();

router.post('/check-email', checkEmailExists);
router.post('/send-otp', otpLimiter, otpValidation, sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', registerValidation, registerUser);
router.post('/login', authLimiter, loginValidation, loginUser);
router.post('/logout', protect, logoutUser);
router.post('/google', googleAuth);
router.post('/linkedin', linkedinAuth);
router.post('/facebook', facebookAuth);
router.post('/refresh-token', refreshAccessToken);
router.post('/oauth', oauthLogin);
router.get('/linkedin/callback', linkedinAuthCallback);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPassword);

// 2FA Endpoints
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/login-verify', loginVerify2FA);
router.post('/2fa/disable', protect, disable2FA);

// Profile & Sessions
router.get('/profile', protect, getProfile);
router.put('/profile', protect, profileUpdateValidation, updateUserProfile);
router.put('/change-password', protect, changePasswordValidation, changePassword);
router.delete('/account', protect, deleteAccount);
router.get('/users', optionalProtect, getUsers);
router.get('/suggestions', protect, getSuggestions);
router.get('/login-history', protect, getLoginHistory);
router.get('/sessions', protect, getActiveSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);

router.post('/follow/:id', protect, toggleFollow);
router.get('/followers', protect, getFollowers);
router.get('/following', protect, getFollowing);

// Connection Requests
router.post('/connect/:id', protect, sendConnectionRequest);
router.get('/connection-requests', protect, getConnectionRequests);
router.post('/connection-requests/:id/accept', protect, acceptConnectionRequest);
router.post('/connection-requests/:id/decline', protect, declineConnectionRequest);

router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationsRead);

module.exports = router;
