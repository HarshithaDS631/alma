const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    adminEmail: { type: String, required: true },
    adminName: { type: String },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: 'Unknown' },
    loginTime: { type: Date, default: Date.now },
    logoutTime: { type: Date, default: null },
    durationSeconds: { type: Number, default: null },
    status: { type: String, enum: ['active', 'logged_out', 'expired'], default: 'active' }
}, { timestamps: true });

adminSessionSchema.index({ admin: 1, loginTime: -1 });
adminSessionSchema.index({ sessionId: 1 });

module.exports = mongoose.model('AdminSession', adminSessionSchema, 'adminsessions');
