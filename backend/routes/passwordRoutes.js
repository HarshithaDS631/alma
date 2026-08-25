const express = require('express');
const router = express.Router();
const {
    changePassword,
    resetPasswordWithOTP
} = require('../controllers/passwordController');
const { protect } = require('../middleware/authMiddleware');

router.post('/change', protect, changePassword);
router.post('/reset', resetPasswordWithOTP);

module.exports = router;
