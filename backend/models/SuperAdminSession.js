const mongoose = require('mongoose');

const superAdminSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    superAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdminUser', required: true },
    superAdminEmail: { type: String, required: true },
    superAdminName: { type: String },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: 'Unknown' },
    loginTime: { type: Date, default: Date.now },
    logoutTime: { type: Date, default: null },
    durationSeconds: { type: Number, default: null },
    status: { type: String, enum: ['active', 'logged_out', 'expired'], default: 'active' }
}, { timestamps: true });

superAdminSessionSchema.index({ superAdmin: 1, loginTime: -1 });
superAdminSessionSchema.index({ sessionId: 1 });

module.exports = mongoose.model('SuperAdminSession', superAdminSessionSchema, 'superadminsessions');
