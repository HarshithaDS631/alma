const mongoose = require('mongoose');

const alumniVerificationSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'User reference is required'],
        index: true
    },
    institution: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Institution', 
        required: [true, 'Institution reference is required'],
        index: true
    },
    department: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Department', 
        required: [true, 'Department reference is required']
    },
    usnOrRollNo: { 
        type: String, 
        required: [true, 'USN or Roll Number is required'],
        trim: true,
        uppercase: true
    },
    graduationYear: { 
        type: Number, 
        required: [true, 'Graduation year is required']
    },
    degree: { 
        type: String, 
        required: [true, 'Degree / Course is required'],
        trim: true
    },
    idProofDocumentUrl: { 
        type: String, 
        required: [true, 'ID proof document URL is required'] 
    },
    status: { 
        type: String, 
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED'], 
        default: 'PENDING',
        index: true
    },
    reviewedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    reviewedAt: { 
        type: Date 
    },
    rejectionReason: { 
        type: String, 
        default: '' 
    }
}, { 
    timestamps: true 
});

alumniVerificationSchema.index({ user: 1, institution: 1 });
alumniVerificationSchema.index({ institution: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('AlumniVerification', alumniVerificationSchema);
