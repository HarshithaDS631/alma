const mongoose = require('mongoose');

const superAdminActivityLogSchema = new mongoose.Schema({
    superAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SuperAdminUser',
        required: false
    },
    superAdminEmail: { type: String },
    superAdminName: { type: String },
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

// Indexes for fast lookup by super admin or action
superAdminActivityLogSchema.index({ superAdmin: 1, createdAt: -1 });
superAdminActivityLogSchema.index({ actionType: 1, createdAt: -1 });

module.exports = mongoose.model('SuperAdminActivityLog', superAdminActivityLogSchema, 'superadminactivitylogs');
