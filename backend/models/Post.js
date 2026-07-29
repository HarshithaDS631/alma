const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { 
        type: String, 
        required: function() { return !this.image; } 
    },
    image: { type: String },
    fileType: { type: String },
    fileName: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reshares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    originalAuthorName: { type: String },
    isArchived: { type: Boolean, default: false },
    hideLikeCount: { type: Boolean, default: false },
    hideShareCount: { type: Boolean, default: false },
    commentsDisabled: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Indexes for fast timeline feed sorting & user post lookups
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: 1 });

module.exports = mongoose.model('Post', postSchema);
