const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../controllers/firebaseAuthController');
const { authLimiter } = require('../middleware/rateLimiter');

// Route to verify Firebase ID Token & return session (rate limited against token stuffing)
router.post('/verify-token', authLimiter, verifyFirebaseToken);

module.exports = router;
