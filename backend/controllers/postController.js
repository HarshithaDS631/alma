const Post = require('../models/Post');
const User = require('../models/User');
const BlockedUser = require('../models/BlockedUser');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

// @desc    Get all posts (Filtered to Followed Alumni, Own Posts & Official Announcements)
// @route   GET /api/posts
exports.getPosts = async (req, res) => {
    try {
        await connectDB();

        // Fetch users the current user has blocked or who have blocked the current user
        const blockedRecords = await BlockedUser.find({
            $or: [{ blocker: req.user._id }, { blocked: req.user._id }]
        });
        
        const blockedUserIds = blockedRecords.map(record => {
            return record.blocker.toString() === req.user._id.toString() 
                ? record.blocked 
                : record.blocker;
        });

        // Fetch current user details including following list, role, and institution
        const currentUser = await User.findById(req.user._id).select('following role institution');

        let query = { user: { $nin: blockedUserIds } };

        // For Alumni and Student roles: display posts from followed users, own posts, official announcements, and all content under Media Cell Institution
        if (currentUser && currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin') {
            const followedUserIds = (currentUser.following || []).map(id => id.toString());
            
            // Include Admin and Super Admin user IDs so official announcements remain visible
            const adminUsers = await User.find({ role: { $in: ['Admin', 'Super Admin'] } }).select('_id');
            const adminUserIds = adminUsers.map(a => a._id.toString());

            // Fetch ALL users belonging to Media Cell Institution so institution posts are displayed
            const mediaCellUsers = await User.find({
                $or: [
                    { institution: /media\s*cell/i },
                    { institution: currentUser.institution ? new RegExp(currentUser.institution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : /media/i }
                ]
            }).select('_id');
            const mediaCellUserIds = mediaCellUsers.map(u => u._id.toString());

            let allowedCreatorIds;

            if (followedUserIds.length === 0) {
                // User hasn't followed anyone yet — show ALL posts from institution + admins
                // so the feed is never empty on first login
                allowedCreatorIds = Array.from(new Set([
                    req.user._id.toString(),
                    ...adminUserIds,
                    ...mediaCellUserIds
                ]));

                // If still very few posts would show, fetch all users (open feed for new users)
                if (allowedCreatorIds.length < 3) {
                    // Return all posts (no user filter, just block filter)
                    query.user = { $nin: blockedUserIds };
                } else {
                    query.user = { $in: allowedCreatorIds, $nin: blockedUserIds };
                }
            } else {
                // User follows people — show their feed + own posts + admins + institution
                allowedCreatorIds = Array.from(new Set([
                    req.user._id.toString(),
                    ...followedUserIds,
                    ...adminUserIds,
                    ...mediaCellUserIds
                ]));
                query.user = { $in: allowedCreatorIds, $nin: blockedUserIds };
            }
        }

        const posts = await Post.find(query)
            .populate('user', 'name branch department batchYear avatar_url username role institution')
            .populate('tags', 'name username avatar_url')
            .populate('comments.user', 'name avatar_url username')
            .sort({ createdAt: -1 })
            .lean();

        res.json(posts);
    } catch (error) {
        console.error('[GET POSTS CONTROLLER ERROR]:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a post
// @route   POST /api/posts
exports.createPost = async (req, res) => {
    const { content, image, fileType, fileName, tags } = req.body;

    try {
        const post = await Post.create({
            user: req.user._id,
            content,
            image,
            fileType,
            fileName,
            tags: Array.isArray(tags) ? tags : []
        });

        const fullPost = await post.populate([
            { path: 'user', select: 'name branch department batchYear avatar_url username' },
            { path: 'tags', select: 'name username avatar_url' }
        ]);

        // Create notifications for tagged users
        if (Array.isArray(tags) && tags.length > 0) {
            const notifications = tags.map(tagId => ({
                recipient: tagId,
                sender: req.user._id,
                type: 'mention',
                title: 'You were tagged in a post',
                message: `${req.user.name || 'A connection'} tagged you in a new post.`
            }));
            await Notification.insertMany(notifications);
        }

        res.status(201).json(fullPost);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Like a post
// @route   PUT /api/posts/:id/like
exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (post.likes.includes(req.user._id)) {
            post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
        }

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('user');
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the current user owns the post OR is an admin
        if (post.user._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
            return res.status(401).json({ message: 'User not authorized to delete this post' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = {
            user: req.user._id,
            text: text.trim(),
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        const updatedPost = await Post.findById(req.params.id)
            .populate('user', 'name branch department batchYear avatar_url')
            .populate('comments.user', 'name avatar_url');

        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle save post for user
// @route   PUT /api/posts/:id/save
exports.toggleSavePost = async (req, res) => {
    try {
        const user = req.user;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const isSavedUser = user.savedPosts && user.savedPosts.some(id => id.toString() === postId.toString());
        if (isSavedUser) {
            user.savedPosts = (user.savedPosts || []).filter(id => id.toString() !== postId.toString());
            post.savedBy = (post.savedBy || []).filter(id => id.toString() !== user._id.toString());
        } else {
            if (!user.savedPosts) user.savedPosts = [];
            if (!user.savedPosts.some(id => id.toString() === postId.toString())) {
                user.savedPosts.push(postId);
            }
            if (!post.savedBy) post.savedBy = [];
            if (!post.savedBy.some(id => id.toString() === user._id.toString())) {
                post.savedBy.push(user._id);
            }
        }
        
        await Promise.all([user.save(), post.save()]);
        res.json({ saved: !isSavedUser, savedPosts: user.savedPosts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's saved posts
// @route   GET /api/posts/saved
exports.getSavedPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'savedPosts',
            populate: {
                path: 'user',
                select: 'name branch department batchYear avatar_url'
            }
        });

        const rawSaved = user.savedPosts || [];
        const seen = new Set();
        const uniqueSaved = [];
        for (const item of rawSaved) {
            if (item && item._id) {
                const idStr = item._id.toString();
                if (!seen.has(idStr)) {
                    seen.add(idStr);
                    uniqueSaved.push(item);
                }
            }
        }

        res.json(uniqueSaved);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reshare a post to user's feed
// @route   POST /api/posts/:id/reshare
exports.resharePost = async (req, res) => {
    try {
        const originalPost = await Post.findById(req.params.id).populate('user', 'name');
        if (!originalPost) {
            return res.status(404).json({ message: 'Original post not found' });
        }

        // Increment reshares on original post
        if (!originalPost.reshares) originalPost.reshares = [];
        if (!originalPost.reshares.includes(req.user._id)) {
            originalPost.reshares.push(req.user._id);
            await originalPost.save();
        }

        // Create new reshared post entry in feed
        const { note } = req.body;
        const resharedPost = await Post.create({
            user: req.user._id,
            content: note ? `${note}\n\n🔄 Reshared from @${originalPost.user?.name || 'Alumni'}: ${originalPost.content || ''}` : `🔄 Reshared from @${originalPost.user?.name || 'Alumni'}: ${originalPost.content || ''}`,
            image: originalPost.image,
            fileType: originalPost.fileType,
            fileName: originalPost.fileName,
            originalPost: originalPost._id,
            originalAuthorName: originalPost.user?.name || 'Alumni Member'
        });

        const populatedReshare = await Post.findById(resharedPost._id)
            .populate('user', 'name branch department batchYear avatar_url');

        res.status(201).json({ message: 'Post reshared to your feed successfully!', post: populatedReshare, resharesCount: originalPost.reshares.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update post settings (archive, hide counts, disable comments, pin)
// @route   PUT /api/posts/:id/settings
exports.updatePostSettings = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to update this post' });
        }
        
        const { isArchived, hideLikeCount, hideShareCount, commentsDisabled, isPinned } = req.body;
        
        if (isArchived !== undefined) post.isArchived = isArchived;
        if (hideLikeCount !== undefined) post.hideLikeCount = hideLikeCount;
        if (hideShareCount !== undefined) post.hideShareCount = hideShareCount;
        if (commentsDisabled !== undefined) post.commentsDisabled = commentsDisabled;
        if (isPinned !== undefined) post.isPinned = isPinned;
        
        await post.save();
        
        const updatedPost = await Post.findById(req.params.id)
            .populate('user', 'name branch department batchYear avatar_url')
            .populate('comments.user', 'name avatar_url');
            
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Edit a post content
// @route   PUT /api/posts/:id/edit
exports.editPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to edit this post' });
        }
        
        const { content } = req.body;
        if (content !== undefined) {
            post.content = content;
        }
        
        await post.save();
        
        const updatedPost = await Post.findById(req.params.id)
            .populate('user', 'name branch department batchYear avatar_url')
            .populate('comments.user', 'name avatar_url');
            
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's profile posts (authored, reshared, tagged)
// @route   GET /api/posts/user/profile
exports.getUserPosts = async (req, res) => {
    try {
        await connectDB();
        const userId = req.user._id;

        const posts = await Post.find({
            $or: [
                { user: userId },
                { reshares: userId },
                { tags: userId },
                { originalPost: { $exists: true } }
            ]
        })
        .populate('user', 'name branch department batchYear avatar_url username role institution')
        .populate('tags', 'name username avatar_url')
        .populate('comments.user', 'name avatar_url username')
        .sort({ createdAt: -1 })
        .lean();

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
