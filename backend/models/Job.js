const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    institution: { type: String, default: 'All Institutions' },
    workplaceType: { 
        type: String, 
        enum: ['On-site', 'Hybrid', 'Remote'], 
        default: 'On-site' 
    },
    jobType: { 
        type: String, 
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], 
        default: 'Full-time' 
    },
    experienceLevel: { type: String, default: 'Mid-Senior' },
    salaryRange: { type: String, default: '' },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    keywords: [{ type: String }],
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        appliedAt: { type: Date, default: Date.now },
        status: { 
            type: String, 
            enum: ['Applied', 'Under Review', 'Interviewing', 'Offered', 'Rejected'], 
            default: 'Applied' 
        },
        resumeUrl: { type: String, default: '' },
        coverNote: { type: String, default: '' }
    }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    viewsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

jobSchema.index({ institution: 1, createdAt: -1 });
jobSchema.index({ title: 'text', company: 'text', location: 'text' });
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);

