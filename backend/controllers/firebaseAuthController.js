const axios = require('axios');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.FCM_SERVER_KEY || 'AIzaSyBeYSmgQ3zbqVl__gEszJpaPausQt2_Fc0';

// @desc    Verify Firebase ID Token & Synchronize MongoDB User Account
// @route   POST /api/firebase-auth/verify-token
exports.verifyFirebaseToken = async (req, res) => {
    try {
        const { idToken, name, role, institution } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: 'Firebase ID token is required' });
        }

        // Verify Firebase Token using Firebase Identity Toolkit API
        const response = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
            idToken
        });

        const firebaseUser = response.data.users?.[0];
        if (!firebaseUser) {
            return res.status(401).json({ message: 'Invalid or expired Firebase ID token' });
        }

        const { email, localId, emailVerified } = firebaseUser;

        // Find or provision user in MongoDB Atlas
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                authProvider: 'firebase',
                providerId: localId,
                role: role || 'Alumni',
                institution: institution || 'RV College of Engineering',
                verified: Boolean(emailVerified),
                is_approved: true
            });
        } else {
            user.providerId = localId;
            user.authProvider = 'firebase';
            if (emailVerified) user.verified = true;
            await user.save();
        }

        // Generate JWT Session Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                institution: user.institution,
                avatar_url: user.avatar_url,
                verified: user.verified
            }
        });
    } catch (error) {
        console.error('[FIREBASE TOKEN VERIFY ERROR]:', error.response?.data?.error?.message || error.message);
        res.status(500).json({ message: error.response?.data?.error?.message || 'Firebase token verification failed' });
    }
};
