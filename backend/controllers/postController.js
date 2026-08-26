const mongoose = require('mongoose');
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
        const userInstitution = currentUser?.institution || req.user.institution;

        let query = { user: { $nin: blockedUserIds } };

        // For Alumni, Student, and Institution Admin roles: enforce strict institution filtering
        if (currentUser && currentUser.role !== 'Super Admin') {
            const followedUserIds = (currentUser.following || []).map(id => id.toString());
            
            // Find users strictly belonging to the same institution
            const institutionUsers = await User.find({
                institution: userInstitution ? new RegExp(`^${userInstitution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') : { $exists: true }
            }).select('_id');
            const institutionUserIds = institutionUsers.map(u => u._id.toString());

            // Also find Super Admins for global announcements
            const superAdmins = await User.find({ role: 'Super Admin' }).select('_id');
            const superAdminIds = superAdmins.map(s => s._id.toString());

            const allowedCreatorIds = Array.from(new Set([
                req.user._id.toString(),
                ...institutionUserIds,
                ...superAdminIds
            ]));

            query.$or = [
                { institution: userInstitution ? new RegExp(`^${userInstitution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') : undefined },
                { user: { $in: allowedCreatorIds, $nin: blockedUserIds } }
            ].filter(cond => cond.institution !== undefined || cond.user);

            if (query.$or.length === 0) {
                query.user = { $in: allowedCreatorIds, $nin: blockedUserIds };
                delete query.$or;
            }
        } else if (req.query.institution && req.query.institution !== 'All') {
            // Super Admin filtering by specific institution
            const targetInst = req.query.institution;
            const instUsers = await User.find({
                institution: new RegExp(`^${targetInst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
            }).select('_id');
            const instUserIds = instUsers.map(u => u._id.toString());

            query.$or = [
                { institution: new RegExp(`^${targetInst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                { user: { $in: instUserIds, $nin: blockedUserIds } }
            ];
        }

        const posts = await Post.find(query)
            .populate('user', 'name branch department batchYear avatar_url username role institution')
            .populate('tags', 'name username avatar_url')
            .populate('comments.user', 'name avatar_url username')
            .populate({
                path: 'originalPost',
                populate: { path: 'user', select: 'name department branch batchYear avatar_url' }
            })
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
    const { content, image, image_url, fileType, fileName, tags } = req.body;

    try {
        await connectDB();
        const userDoc = await User.findById(req.user._id).select('institution name branch department batchYear avatar_url username role');
        const userInstitution = req.user.institution || userDoc?.institution || 'Mediacell';

        const validTags = Array.isArray(tags) 
            ? tags.filter(t => t && mongoose.Types.ObjectId.isValid(t)) 
            : [];

        const post = await Post.create({
            user: req.user._id,
            institution: userInstitution,
            content,
            image: image || image_url,
            fileType,
            fileName,
            tags: validTags
        });

        const fullPost = await post.populate([
            { path: 'user', select: 'name branch department batchYear avatar_url username institution role' },
            { path: 'tags', select: 'name username avatar_url' }
        ]);

        // Create notifications for tagged users
        if (validTags.length > 0) {
            try {
                const notifications = validTags.map(tagId => ({
                    recipient: tagId,
                    sender: req.user._id,
                    type: 'mention',
                    title: 'You were tagged in a post',
                    message: `${req.user.name || 'A connection'} tagged you in a new post.`
                }));
                await Notification.insertMany(notifications);
            } catch (notifErr) {
                console.log('Notification error on post tagging:', notifErr.message);
            }
        }

        if (req.io) {
            req.io.emit('new_post_created', fullPost);
        }

        res.status(201).json(fullPost);
    } catch (error) {
        console.error('createPost error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Like / Unlike a post
// @route   PUT /api/posts/:id/like
exports.likePost = async (req, res) => {
    try {
        await connectDB();
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userIdStr = req.user._id.toString();
        if (!Array.isArray(post.likes)) {
            post.likes = [];
        }

        const alreadyLiked = post.likes.some(id => id && id.toString() === userIdStr);

        if (alreadyLiked) {
            post.likes = post.likes.filter(id => id && id.toString() !== userIdStr);
        } else {
            post.likes.push(req.user._id);

            // Send notification to post owner if it's not a self-like
            if (post.user && post.user.toString() !== userIdStr) {
                try {
                    await Notification.create({
                        recipient: post.user,
                        sender: req.user._id,
                        type: 'like',
                        message: `${req.user.name || 'Someone'} liked your post`,
                        post: post._id,
                        is_read: false
                    });
                } catch (e) {
                    console.log('Notification creation error on like:', e.message);
                }
            }
        }

        await post.save();

        const updatedPost = await Post.findById(post._id)
            .populate('user', 'name branch department batchYear avatar_url username role institution')
            .populate('tags', 'name username avatar_url')
            .populate('comments.user', 'name avatar_url username');

        if (req.io) {
            req.io.emit('post_liked_updated', {
                postId: post._id,
                likes: updatedPost.likes,
                likesCount: updatedPost.likes.length
            });
        }

        res.json(updatedPost);
    } catch (error) {
        console.error('Error in likePost controller:', error);
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

        if (req.io) {
            req.io.emit('post_comment_added', {
                postId: post._id,
                comments: updatedPost.comments,
                commentsCount: updatedPost.comments.length
            });
        }

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
        const originalPost = await Post.findById(req.params.id)
            .populate('user', 'name department branch batchYear avatar_url');
        if (!originalPost) {
            return res.status(404).json({ message: 'Original post not found' });
        }

        // Increment reshares on original post
        if (!originalPost.reshares) originalPost.reshares = [];
        if (!originalPost.reshares.includes(req.user._id)) {
            originalPost.reshares.push(req.user._id);
            await originalPost.save();
        }

        // Create new reshared post entry — store the note or original content indicator
        const { note } = req.body;
        const noteContent = (note && typeof note === 'string' && note.trim()) ? note.trim() : (originalPost.content ? `Reshared: ${originalPost.content.substring(0, 80)}` : 'Reshared post');
        const resharedPost = await Post.create({
            user: req.user._id,
            content: noteContent,
            image: null, // reshare has no image of its own
            originalPost: originalPost._id,
            originalAuthorName: originalPost.user?.name || 'Alumni Member',
            isReshare: true
        });

        const populatedReshare = await Post.findById(resharedPost._id)
            .populate('user', 'name branch department batchYear avatar_url username role institution')
            .populate({
                path: 'originalPost',
                populate: { path: 'user', select: 'name department branch batchYear avatar_url username' }
            });

        if (req.io) {
            req.io.emit('new_post_created', populatedReshare);
        }

        res.status(201).json({ message: 'Reposted successfully!', post: populatedReshare, resharesCount: originalPost.reshares.length });
    } catch (error) {
        console.error('resharePost error:', error);
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
