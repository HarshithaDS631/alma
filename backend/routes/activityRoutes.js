const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const ActivityLog = require('../models/ActivityLog');

// @route   POST /api/activity/track
// @desc    Track custom frontend activity (clicks, page views, UI events)
// @access  Private
router.post('/track', protect, async (req, res) => {
    try {
        const { actionType, metadata } = req.body;
        
        await ActivityLog.create({
            user: req.user ? req.user._id : null,
            actionType: actionType || 'FRONTEND_ACTION',
            method: 'CLIENT',
            endpoint: req.originalUrl,
            metadata: metadata || {},
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            status: 200
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Track Activity Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/activity
// @desc    Get real-time system activity logs from MongoDB Atlas (Admin only)
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const { limit = 100, search } = req.query;

        let query = {};
        if (search) {
            query = {
                $or: [
                    { actionType: { $regex: search, $options: 'i' } },
                    { endpoint: { $regex: search, $options: 'i' } },
                    { method: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const activities = await ActivityLog.find(query)
            .populate('user', 'name email role department')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit, 10));

        res.json({
            count: activities.length,
            activities
        });
    } catch (error) {
        console.error('Get Activity Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
