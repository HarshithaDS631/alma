const express = require('express');
const router = express.Router();
const {
    changePassword,
    resetPasswordWithOTP
} = require('../controllers/passwordController');
const { protect } = require('../middleware/authMiddleware');
const { passwordResetLimiter } = require('../middleware/rateLimiter');

router.post('/change', protect, changePassword);
router.post('/reset', passwordResetLimiter, resetPasswordWithOTP);

module.exports = router;
