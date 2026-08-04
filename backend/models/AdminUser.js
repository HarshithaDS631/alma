const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    institution: { type: String, default: 'Media Cell Institution' },
    role: { type: String, enum: ['Admin', 'Super Admin'], default: 'Admin' },
    department: { type: String, default: 'Administration' },
    avatar_url: { type: String },
    passwordHistory: [{ type: String }],
    loginHistory: [{
        ip: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now },
        success: { type: Boolean, default: true }
    }]
}, { timestamps: true });

// Hash password before saving
adminUserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    if (!this.password) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
adminUserSchema.methods.comparePassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if entered password matches current password or any password in history
adminUserSchema.methods.isPasswordInHistory = async function(enteredPassword) {
    if (!enteredPassword) return false;
    if (this.password && await bcrypt.compare(enteredPassword, this.password)) {
        return true;
    }
    if (this.passwordHistory && Array.isArray(this.passwordHistory)) {
        for (const oldHash of this.passwordHistory) {
            if (oldHash && await bcrypt.compare(enteredPassword, oldHash)) {
                return true;
            }
        }
    }
    return false;
};

module.exports = mongoose.model('AdminUser', adminUserSchema, 'admins');
