const mongoose = require('mongoose');

// Per-institution admin configuration (welcome email template, automation flags)
const adminSettingSchema = new mongoose.Schema({
    institution: { type: String, required: true, unique: true, trim: true },
    welcomeEmail: {
        subject: { type: String, default: '' },
        body: { type: String, default: '' },
        autoSend: { type: Boolean, default: true }
    },
    updatedBy: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('AdminSetting', adminSettingSchema);
