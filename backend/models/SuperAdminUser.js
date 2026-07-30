const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    institution: { type: String, default: 'Media Cell Institution' },
    role: { type: String, default: 'Super Admin' },
    department: { type: String, default: 'Super Administration' },
    avatar_url: { type: String },
    loginHistory: [{
        ip: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now },
        success: { type: Boolean, default: true }
    }]
}, { timestamps: true });

// Hash password before saving
superAdminUserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    if (!this.password) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
superAdminUserSchema.methods.comparePassword = async function(enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('SuperAdminUser', superAdminUserSchema, 'superadmins');
