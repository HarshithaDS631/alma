const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    institution: { type: String },
    password: { type: String },
    branch: { type: String },
    department: { type: String },
    batchYear: { type: String },
    joiningYear: { type: String },
    company: { type: String },
    designation: { type: String },
    location: { type: String },
    profilePicture: { type: String },
    bio: { type: String },
    linkedin: { type: String },
    avatar_url: { type: String },
    dateOfBirth: { type: Date },
    role: { type: String, enum: ['Alumni', 'Admin', 'Super Admin'], default: 'Alumni' },
    is_approved: { type: Boolean, default: false },
    isVerifiedByMediacell: { type: Boolean, default: false },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    verified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    authProvider: { type: String, default: 'local' },
    providerId: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    passwordHistory: [{ type: String }],
    pushToken: { type: String },
    fcmToken: { type: String },

    // Security & Session Management
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorTempSecret: { type: String, select: false },
    twoFactorBackupCodes: [{ type: String, select: false }],
    loginHistory: [{
        ip: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now },
        success: { type: Boolean, default: true }
    }],

    // Profile Enhancement & Resume Book
    skills: [{ type: String }],
    headline: { type: String },
    domain: { type: String, default: '' },
    experienceYears: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    resumeFileName: { type: String, default: '' },
    resumeUpdatedAt: { type: Date },
    isJobSeeker: { type: Boolean, default: false },
    
    // Post Management
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
}, { timestamps: true });

// Database search indexes for fast lookup and user filtering
userSchema.index({ is_approved: 1, name: 1 });
userSchema.index({ role: 1 });
userSchema.index({ institution: 1, department: 1, batchYear: 1 });
// Text search index for unified search
userSchema.index({ name: 'text', company: 'text', designation: 'text', department: 'text', institution: 'text', bio: 'text' });

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    if (!this.password) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if entered password matches current password or any password in history
userSchema.methods.isPasswordInHistory = async function(enteredPassword) {
    if (!enteredPassword) return false;
    
    // Check against current password
    if (this.password && await bcrypt.compare(enteredPassword, this.password)) {
        return true;
    }
    
    // Check against password history
    if (this.passwordHistory && Array.isArray(this.passwordHistory)) {
        for (const oldHash of this.passwordHistory) {
            if (oldHash && await bcrypt.compare(enteredPassword, oldHash)) {
                return true;
            }
        }
    }
    
    return false;
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
