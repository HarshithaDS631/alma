const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    userName: { type: String },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: 'Unknown' },
    loginTime: { type: Date, default: Date.now },
    logoutTime: { type: Date, default: null },
    durationSeconds: { type: Number, default: null },
    status: { type: String, enum: ['active', 'logged_out', 'expired'], default: 'active' }
}, { timestamps: true });

userSessionSchema.index({ user: 1, loginTime: -1 });
userSessionSchema.index({ sessionId: 1 });

module.exports = mongoose.model('UserSession', userSessionSchema, 'usersessions');
