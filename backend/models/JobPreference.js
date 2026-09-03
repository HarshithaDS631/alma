const mongoose = require('mongoose');

const jobPreferenceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    openToWork: { type: Boolean, default: true },
    targetTitles: [{ type: String }],
    targetLocations: [{ type: String }],
    keywords: [{ type: String }], // 'Python', 'React', 'Machine Learning', etc.
    skills: [{ type: String }],
    jobTypes: [{ type: String }], // 'Full-time', 'Remote', etc.
    preferredIndustry: { type: String, default: 'Technology' },
    minSalary: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('JobPreference', jobPreferenceSchema);
