const mongoose = require('mongoose');

const mentorshipProfileSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['mentor', 'mentee'], 
        required: true 
    },
    areas: [{ 
        type: String, 
        trim: true 
    }],
    // Mentee Specific Questionnaire (AlmaConnect Standard)
    whyMentor: { 
        type: String, 
        trim: true,
        default: '' 
    },
    guidance: { 
        type: String, 
        trim: true,
        default: '' 
    },
    progress: { 
        type: String, 
        trim: true,
        default: '' 
    },
    activities: { 
        type: String, 
        trim: true,
        default: '' 
    },
    // Mentor Specific Fields
    about: { 
        type: String, 
        trim: true,
        default: '' 
    },
    availability: { 
        type: String, 
        trim: true,
        default: 'Flexible, 2 slots/month' 
    },
    maxMentees: { 
        type: Number, 
        default: 3 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

mentorshipProfileSchema.index({ user: 1, type: 1 }, { unique: true });
mentorshipProfileSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('MentorshipProfile', mentorshipProfileSchema);
