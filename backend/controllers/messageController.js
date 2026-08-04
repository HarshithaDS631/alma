const Message = require('../models/Message');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');

const mongoose = require('mongoose');

// Helper to resolve target user ObjectId
const resolveUserId = async (idParam) => {
    if (!idParam) return null;
    if (mongoose.Types.ObjectId.isValid(idParam)) {
        const userById = await User.findById(idParam);
        if (userById) return userById._id;
    }
    const foundUser = await User.findOne({ 
        $or: [{ username: idParam }, { email: idParam }, { name: idParam }] 
    });
    return foundUser ? foundUser._id : (mongoose.Types.ObjectId.isValid(idParam) ? idParam : null);
};

// @desc    Send a message
// @route   POST /api/messages/:userId
exports.sendMessage = async (req, res) => {
    try {
        const { text, attachment, replyTo, isForwarded } = req.body;
        const targetId = await resolveUserId(req.params.userId);
        const senderId = req.user._id;

        if (!text && (!attachment || !attachment.url)) {
            return res.status(400).json({ message: 'Message text or attachment is required' });
        }
        if (!targetId) return res.status(400).json({ message: 'Target user not found' });

        const messageData = {
            sender: senderId,
            receiver: targetId,
            text: text || '',
            encrypted_text: text ? encrypt(text) : '',
            isForwarded: Boolean(isForwarded)
        };

        if (attachment && attachment.url) {
            messageData.attachment = {
                url: attachment.url,
                type: attachment.type || 'file',
                name: attachment.name || 'Attachment'
            };
        }

        if (replyTo && replyTo.text) {
            messageData.replyTo = {
                _id: replyTo._id || '',
                text: replyTo.text || '',
                senderName: replyTo.senderName || ''
            };
        }

        const message = await Message.create(messageData);
        const responseMsg = message.toObject();

        // Dispatch Push Notification to message recipient
        try {
            const { sendFCMNotification } = require('../utils/fcmService');
            const receiverUser = await User.findById(targetId).select('fcmToken pushToken name');
            if (receiverUser) {
                const deviceToken = receiverUser.fcmToken || receiverUser.pushToken;
                const pushTitle = `💬 Message from ${req.user.name || 'Alumni'}`;
                const pushBody = text || (attachment ? `Sent an attachment: ${attachment.name || 'File'}` : 'Sent a message');
                if (deviceToken) {
                    await sendFCMNotification(deviceToken, pushTitle, pushBody, { type: 'message', senderId: senderId.toString() });
                } else {
                    console.log(`[PUSH NOTIFICATION DISPATCHED] To: ${receiverUser.name} | TITLE: "${pushTitle}" | BODY: "${pushBody}"`);
                }
            }
        } catch (pushErr) {
            console.error('[MESSAGE PUSH ERROR]:', pushErr.message);
        }

        res.status(201).json(responseMsg);
    } catch (error) {
        console.error('sendMessage error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle emoji reaction on a message
// @route   PUT /api/messages/:messageId/react
exports.reactMessage = async (req, res) => {
    try {
        const { emoji } = req.body;
        const messageId = req.params.messageId;
        const userId = req.user._id;

        if (!emoji) return res.status(400).json({ message: 'Emoji is required' });

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        const existingReactionIndex = message.reactions.findIndex(
            r => r.user && r.user.toString() === userId.toString()
        );

        if (existingReactionIndex > -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                // Remove reaction if same emoji pressed again
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // Replace emoji
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            // Add new reaction
            message.reactions.push({ user: userId, emoji });
        }

        await message.save();
        res.json(message);
    } catch (error) {
        console.error('reactMessage error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get conversation with a user
// @route   GET /api/messages/:userId
exports.getConversation = async (req, res) => {
    try {
        const targetId = await resolveUserId(req.params.userId);
        const currentUserId = req.user._id;

        if (!targetId) {
            return res.json([]);
        }

        const currentUserIdStr = currentUserId.toString();
        const targetIdStr = targetId.toString();

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: targetId },
                { sender: targetId, receiver: currentUserId },
                { sender: currentUserIdStr, receiver: targetIdStr },
                { sender: targetIdStr, receiver: currentUserIdStr }
            ]
        }).sort('createdAt'); // oldest to newest for chat UI

        // Mark received messages as read
        await Message.updateMany(
            { 
                $or: [
                    { sender: targetId, receiver: currentUserId },
                    { sender: targetIdStr, receiver: currentUserIdStr }
                ],
                read: false 
            },
            { $set: { read: true } }
        );
        
        // Ensure legacy encrypted messages are decrypted before sending to client
        const processedMessages = messages.map(msg => {
            const msgObj = msg.toObject();
            if (msgObj.text && typeof msgObj.text === 'string' && msgObj.text.startsWith('U2FsdGVkX1')) {
                try {
                    msgObj.text = decrypt(msgObj.text);
                } catch (e) {}
            }
            return msgObj;
        });

        res.json(processedMessages);
    } catch (error) {
        console.error('getConversation error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get recent chat history (list of conversations)
// @route   GET /api/messages/history/recent
exports.getChatHistory = async (req, res) => {
    try {
        const currentUserId = req.user._id.toString();

        // Find all messages involving the current user
        const messages = await Message.find({
            $or: [
                { sender: req.user._id }, 
                { receiver: req.user._id },
                { sender: currentUserId },
                { receiver: currentUserId }
            ]
        })
        .sort('-createdAt')
        .populate('sender receiver', 'name email avatar_url role degree institution department');

        const chatsMap = new Map();

        for (const msg of messages) {
            if (!msg) continue;

            const senderObj = msg.sender;
            const receiverObj = msg.receiver;

            const senderIdStr = senderObj ? (senderObj._id ? senderObj._id.toString() : senderObj.toString()) : '';
            const receiverIdStr = receiverObj ? (receiverObj._id ? receiverObj._id.toString() : receiverObj.toString()) : '';

            if (!senderIdStr || !receiverIdStr) continue;

            const isSender = senderIdStr === currentUserId;
            const otherUserRaw = isSender ? receiverObj : senderObj;
            const otherUserIdStr = isSender ? receiverIdStr : senderIdStr;

            let otherUserObj = null;

            if (otherUserRaw && typeof otherUserRaw === 'object' && otherUserRaw.name) {
                otherUserObj = otherUserRaw;
            } else {
                // If not populated or raw ID, look up user from DB
                const dbUser = await User.findById(otherUserIdStr).select('name email avatar_url role degree institution department');
                if (dbUser) {
                    otherUserObj = dbUser;
                } else {
                    otherUserObj = {
                        _id: otherUserIdStr,
                        name: 'Alumni Member',
                        institution: 'Alumni Network',
                        role: 'Alumni'
                    };
                }
            }

            if (!chatsMap.has(otherUserIdStr)) {
                const msgObj = msg.toObject ? msg.toObject() : { ...msg };
                if (msgObj.text && typeof msgObj.text === 'string' && msgObj.text.startsWith('U2FsdGVkX1')) {
                    try {
                        msgObj.text = decrypt(msgObj.text);
                    } catch (e) {}
                }

                chatsMap.set(otherUserIdStr, {
                    user: otherUserObj,
                    lastMessage: msgObj,
                    unreadCount: (!isSender && !msg.read) ? 1 : 0
                });
            } else {
                if (!isSender && !msg.read) {
                    chatsMap.get(otherUserIdStr).unreadCount += 1;
                }
            }
        }

        const chatHistory = Array.from(chatsMap.values());
        res.json(chatHistory);
    } catch (error) {
        console.error('getChatHistory error:', error);
        res.status(500).json({ message: error.message });
    }
};
