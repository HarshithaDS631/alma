const mongoose = require('mongoose');

const userExportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    exportTimestamp: {
        type: Date,
        default: Date.now
    },
    statistics: {
        totalPosts: { type: Number, default: 0 },
        totalMessages: { type: Number, default: 0 },
        totalNotifications: { type: Number, default: 0 },
        totalActivityLogs: { type: Number, default: 0 }
    },
    userProfile: Object,
    posts: Array,
    messages: Array,
    notifications: Array,
    activityLogs: Array
}, { timestamps: true });

module.exports = mongoose.model('UserExport', userExportSchema);
