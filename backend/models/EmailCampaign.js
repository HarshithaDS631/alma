const mongoose = require('mongoose');

// One row per email campaign (mass broadcast or welcome send) for real email stats
const emailCampaignSchema = new mongoose.Schema({
    institution: { type: String, required: true, index: true },
    type: { type: String, enum: ['broadcast', 'welcome'], default: 'broadcast', index: true },
    audience: { type: String, default: '' },
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    recipients: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    status: { type: String, enum: ['Sent', 'Partial', 'Failed'], default: 'Sent' },
    initiatedBy: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);
