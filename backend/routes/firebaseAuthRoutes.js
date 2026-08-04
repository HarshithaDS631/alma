const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../controllers/firebaseAuthController');

// Route to verify Firebase ID Token & return session
router.post('/verify-token', verifyFirebaseToken);

module.exports = router;
