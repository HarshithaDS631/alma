const mongoose = require('mongoose');

const passwordHistorySchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    passwordHash: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 365 * 24 * 60 * 60 // 365 days TTL
    }
});

passwordHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PasswordHistory', passwordHistorySchema);
