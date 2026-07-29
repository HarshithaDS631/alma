const User = require('../models/User');
const Post = require('../models/Post');
const Event = require('../models/Event');
const Report = require('../models/Report');
const StudentData = require('../models/StudentData');
const connectDB = require('../config/db');
const mongoose = require('mongoose');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        // Multi-tenant Scoping: If Admin (not Super Admin), force filter to req.user.institution
        const effectiveInstitution = req.user && req.user.role === 'Admin' 
            ? (req.user.institution || 'Media Cell Institution')
            : (req.query.institution || null);
        
        const userFilter = {};
        const pendingUserFilter = { is_approved: false };
        const activeAlumniFilter = { is_approved: true, role: 'Alumni' };

        if (effectiveInstitution && effectiveInstitution !== 'All') {
            userFilter.institution = effectiveInstitution;
            pendingUserFilter.institution = effectiveInstitution;
            activeAlumniFilter.institution = effectiveInstitution;
        }

        const totalUsers = await User.countDocuments(userFilter);
        const pendingUsers = await User.countDocuments(pendingUserFilter);
        const totalAlumni = await User.countDocuments(activeAlumniFilter);
        const totalPosts = await Post.countDocuments();
        const totalEvents = await Event.countDocuments();
        const pendingReports = await Report.countDocuments({ status: 'pending' });

        res.json({
            totalUsers,
            pendingUsers,
            totalAlumni,
            totalPosts,
            totalEvents,
            pendingReports
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users pending approval
// @route   GET /api/admin/pending-users
exports.getPendingUsers = async (req, res) => {
    try {
        // Multi-tenant Scoping: If Admin (not Super Admin), force filter to req.user.institution
        const effectiveInstitution = req.user && req.user.role === 'Admin' 
            ? (req.user.institution || 'Media Cell Institution')
            : (req.query.institution || null);

        let filter = { is_approved: false };
        if (effectiveInstitution && effectiveInstitution !== 'All') {
            filter.institution = effectiveInstitution;
        }

        const pendingUsers = await User.find(filter)
            .select('-password -passwordResetToken -passwordResetExpires')
            .sort({ created_at: -1 });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve a user
// @route   PUT /api/admin/users/:id/approve
exports.approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.is_approved = true;
        await user.save();

        res.json({ message: 'User approved successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject/Delete a pending user
// @route   DELETE /api/admin/users/:id/reject
exports.rejectUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User rejected and deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        
        // Basic validation
        if (!['Alumni', 'Admin', 'Super Admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Only super admin can make other super admins
        if (role === 'Super Admin' && req.user.role !== 'Super Admin') {
             return res.status(403).json({ message: 'Only Super Admins can assign the Super Admin role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Cannot modify own role here to prevent self-demotion
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot modify your own role' });
        }

        user.role = role;
        await user.save();

        res.json({ message: 'User role updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const Message = require('../models/Message');

// @desc    Get all messages stored in MongoDB (Admin view)
// @route   GET /api/admin/messages
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find()
            .populate('sender receiver', 'name email role institution department')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check potential student roster matches for a user
// @route   GET /api/admin/users/:id/check-match
exports.checkMatch = async (req, res) => {
    try {
        await connectDB();
        const userId = req.params.id;
        if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(200).json({ success: false, message: 'Invalid or missing user ID', matches: [] });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(200).json({ success: false, message: 'User not found in system', matches: [] });
        }

        let matches = [];

        // 1. Search by name regex (partial match, case-insensitive)
        if (user.name && user.name.trim()) {
            const escapedName = user.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            matches = await StudentData.find({
                name: { $regex: escapedName, $options: 'i' }
            }).limit(10);
        }

        // 2. Fallback: Search by joining/leaving year if no name match
        if (matches.length === 0) {
            let yearQuery = { $or: [] };
            if (user.joiningYear) yearQuery.$or.push({ joiningYear: user.joiningYear.trim() });
            if (user.batchYear) yearQuery.$or.push({ leavingYear: user.batchYear.trim() });
            
            if (yearQuery.$or.length > 0) {
                 matches = await StudentData.find(yearQuery).limit(5);
            }
        }

        res.json({ success: true, matches: matches || [] });
    } catch (error) {
        console.error('[CHECK MATCH CONTROLLER ERROR]:', error.message);
        res.status(200).json({ success: false, matches: [], message: error.message });
    }
};

// @desc    Export single user's complete data (JSON format download)
// @route   GET /api/admin/users/:id/export
exports.exportUserData = async (req, res) => {
    try {
        await connectDB();
        const userId = req.params.id;
        const user = await User.findById(userId).lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const Post = require('../models/Post');
        const Message = require('../models/Message');
        const Notification = require('../models/Notification');
        const ActivityLog = require('../models/ActivityLog');

        const [posts, messages, notifications, logs] = await Promise.all([
            Post.find({ user: userId }).lean(),
            Message.find({ $or: [{ sender: userId }, { receiver: userId }] }).lean(),
            Notification.find({ recipient: userId }).lean(),
            ActivityLog.find({ user: userId }).lean()
        ]);

        const exportData = {
            exportTimestamp: new Date().toISOString(),
            userProfile: user,
            statistics: {
                totalPosts: posts.length,
                totalMessages: messages.length,
                totalNotifications: notifications.length,
                totalActivityLogs: logs.length
            },
            posts,
            messages,
            notifications,
            activityLogs: logs
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=user_export_${(user.name || 'user').replace(/[^a-zA-Z0-9]/g, '_')}_${userId}.json`);
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
