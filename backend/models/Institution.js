const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Institution name is required'], 
        trim: true, 
        unique: true 
    },
    code: { 
        type: String, 
        required: [true, 'Institution code is required'], 
        uppercase: true, 
        trim: true,
        unique: true 
    },
    domain: { 
        type: String, 
        lowercase: true, 
        trim: true,
        default: ''
    },
    logoUrl: { 
        type: String, 
        default: '' 
    },
    bannerUrl: { 
        type: String, 
        default: '' 
    },
    address: {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        country: { type: String, default: 'India' },
        postalCode: { type: String, default: '' }
    },
    contactEmail: { 
        type: String, 
        required: [true, 'Contact email is required'],
        lowercase: true,
        trim: true
    },
    contactPhone: { 
        type: String, 
        default: '' 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    settings: {
        requireAlumniVerification: { type: Boolean, default: true },
        allowedEmailDomains: [{ type: String, lowercase: true, trim: true }],
        enableJobPortal: { type: Boolean, default: true },
        enableMentorship: { type: Boolean, default: true },
        enableEvents: { type: Boolean, default: true }
    }
}, { 
    timestamps: true 
});

institutionSchema.index({ code: 1 }, { unique: true });
institutionSchema.index({ isActive: 1 });

module.exports = mongoose.model('Institution', institutionSchema);
