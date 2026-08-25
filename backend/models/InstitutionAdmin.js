const mongoose = require('mongoose');

const institutionAdminSchema = new mongoose.Schema({
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
    permissions: [{
        type: String,
        enum: [
            'VERIFY_ALUMNI', 
            'MANAGE_EVENTS', 
            'MANAGE_JOBS', 
            'MANAGE_DEPARTMENTS', 
            'VIEW_ANALYTICS', 
            'BLOCK_USERS',
            'MANAGE_BROADCASTS'
        ],
        default: ['VERIFY_ALUMNI', 'MANAGE_EVENTS', 'MANAGE_JOBS', 'VIEW_ANALYTICS']
    }],
    isPrimaryAdmin: { 
        type: Boolean, 
        default: false 
    },
    status: { 
        type: String, 
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], 
        default: 'ACTIVE' 
    }
}, { 
    timestamps: true 
});

institutionAdminSchema.index({ user: 1, institution: 1 }, { unique: true });

module.exports = mongoose.model('InstitutionAdmin', institutionAdminSchema);
