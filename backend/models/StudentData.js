const mongoose = require('mongoose');

const studentDataSchema = new mongoose.Schema({
    usn: { 
        type: String, 
        uppercase: true, 
        trim: true, 
        sparse: true, 
        index: true 
    },
    sapStudentId: { 
        type: String, 
        trim: true 
    },
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: { 
        type: String, 
        lowercase: true, 
        trim: true, 
        sparse: true,
        index: true 
    },
    personalEmail: { 
        type: String, 
        lowercase: true, 
        trim: true 
    },
    mobilePhone: {
        type: String,
        trim: true
    },
    institution: { 
        type: String, 
        default: 'RV College of Engineering', 
        index: true 
    },
    department: { 
        type: String, 
        trim: true 
    },
    degree: { 
        type: String, 
        trim: true 
    },
    joiningYear: { 
        type: String, 
        trim: true 
    },
    leavingYear: { 
        type: String, 
        required: true, 
        trim: true 
    },
    graduationStatus: { 
        type: String, 
        default: 'COMPLETED',
        enum: ['COMPLETED', 'GRADUATED', 'ACTIVE', 'INACTIVE']
    },
    lastSyncedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// High-speed search compound indexes
studentDataSchema.index({ usn: 1, institution: 1 });
studentDataSchema.index({ email: 1, institution: 1 });
studentDataSchema.index({ name: 'text', usn: 'text', department: 'text' });

module.exports = mongoose.model('StudentData', studentDataSchema);
