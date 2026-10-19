const mongoose = require('mongoose');

// Institution landing pages / forms created from the admin panel
const customPageSchema = new mongoose.Schema({
    institution: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    content: { type: String, default: '' },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Published' },
    views: { type: Number, default: 0 },
    createdBy: { type: String, default: '' }
}, { timestamps: true });

customPageSchema.index({ institution: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('CustomPage', customPageSchema);
