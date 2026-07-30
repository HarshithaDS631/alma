const mongoose = require('mongoose');

const adminActivityLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: false
    },
    adminEmail: { type: String },
    adminName: { type: String },
    actionType: { type: String, required: true },
    method: { type: String },
    endpoint: { type: String },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetUserEmail: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    status: { type: Number }
}, { timestamps: true });

// Indexes for fast lookup by admin or action
adminActivityLogSchema.index({ admin: 1, createdAt: -1 });
adminActivityLogSchema.index({ actionType: 1, createdAt: -1 });

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema, 'adminactivitylogs');
