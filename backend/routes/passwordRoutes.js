const express = require('express');
const router = express.Router();
const {
    changePassword,
    resetPasswordWithOTP
} = require('../controllers/passwordController');
const { protect } = require('../middleware/authMiddleware');
const { passwordResetLimiter } = require('../middleware/rateLimiter');
const { changePasswordValidation, resetPasswordWithOTPValidation } = require('../middleware/requestValidator');

router.post('/change', protect, changePasswordValidation, changePassword);
router.post('/reset', passwordResetLimiter, resetPasswordWithOTPValidation, resetPasswordWithOTP);

module.exports = router;
