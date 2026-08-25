const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    institution: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Institution', 
        required: [true, 'Institution reference is required'],
        index: true
    },
    name: { 
        type: String, 
        required: [true, 'Department name is required'],
        trim: true 
    },
    code: { 
        type: String, 
        required: [true, 'Department code is required'], 
        uppercase: true,
        trim: true
    },
    description: { 
        type: String, 
        default: '' 
    },
    headOfDepartment: { 
        type: String, 
        default: '' 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { 
    timestamps: true 
});

departmentSchema.index({ institution: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
