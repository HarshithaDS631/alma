const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    actor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },
    actorRole: { 
        type: String, 
        enum: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'SYSTEM'], 
        required: true 
    },
    institution: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Institution',
        index: true 
    },
    action: { 
        type: String, 
        required: true,
        enum: [
            'APPROVE_ALUMNI', 
            'REJECT_ALUMNI', 
            'BLOCK_USER', 
            'UNBLOCK_USER',
            'CREATE_INSTITUTION', 
            'UPDATE_INSTITUTION', 
            'DELETE_INSTITUTION',
            'CREATE_DEPARTMENT',
            'UPDATE_DEPARTMENT',
            'DELETE_DEPARTMENT',
            'DELETE_POST', 
            'GRANT_ADMIN_ROLE', 
            'REVOKE_ADMIN_ROLE', 
            'EXPORT_USER_DATA',
            'PASSWORD_RESET_FORCE'
        ],
        index: true
    },
    targetId: { 
        type: mongoose.Schema.Types.ObjectId 
    },
    targetType: { 
        type: String, 
        enum: ['User', 'Institution', 'Department', 'Post', 'Job', 'Event', 'AlumniVerification'] 
    },
    ipAddress: { 
        type: String, 
        default: '' 
    },
    userAgent: { 
        type: String, 
        default: '' 
    },
    metadata: { 
        type: mongoose.Schema.Types.Mixed, 
        default: {} 
    }
}, { 
    timestamps: true 
});

auditLogSchema.index({ institution: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
