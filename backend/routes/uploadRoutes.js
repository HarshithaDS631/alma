const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const crypto = require('crypto');
const path = require('path');
const router = express.Router();

let gfsBucket;

const getGfs = () => {
    if (mongoose.connection.readyState === 1) {
        gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });
    }
    return gfsBucket;
};

const User = require('../models/User');
const JobPreference = require('../models/JobPreference');
const { extractKeywords } = require('../utils/keywordExtractor');

// @desc    Upload file to GridFS
// @route   POST /api/upload
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        await connectDB();
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const gfs = getGfs();
        if (!gfs) {
            return res.status(500).json({ message: 'GridFS not initialized' });
        }

        const ext = path.extname(req.file.originalname);
        const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;

        const uploadStream = gfs.openUploadStream(filename, {
            contentType: req.file.mimetype
        });

        uploadStream.end(req.file.buffer);

        uploadStream.on('finish', async () => {
            const fileUrl = `/api/upload/${filename}`;
            let extractedSkills = [];

            // Detect if uploaded file is a document/resume
            const isDocOrResume = (req.file.mimetype && (
                req.file.mimetype.includes('pdf') ||
                req.file.mimetype.includes('document') ||
                req.file.mimetype.includes('text') ||
                req.file.mimetype.includes('msword')
            )) || /\.(pdf|docx?|txt)$/i.test(req.file.originalname);

            if (isDocOrResume && req.file.buffer) {
                try {
                    const bufferStr = req.file.buffer.toString('utf-8', 0, Math.min(req.file.buffer.length, 500000));
                    const cleanedText = (req.file.originalname + ' ' + bufferStr).replace(/[^\x20-\x7E]/g, ' ');
                    extractedSkills = extractKeywords('', cleanedText, []);
                } catch (parseErr) {
                    console.log('Error parsing resume buffer for skills:', parseErr.message);
                }
            }

            // Sync extracted skills to User profile and JobPreference recommendation engine
            if (req.user && req.user._id && extractedSkills.length > 0) {
                try {
                    await User.findByIdAndUpdate(req.user._id, {
                        $addToSet: { skills: { $each: extractedSkills } },
                        resumeUrl: fileUrl,
                        resumeFileName: req.file.originalname,
                        resumeUpdatedAt: new Date(),
                        isJobSeeker: true
                    });

                    await JobPreference.findOneAndUpdate(
                        { user: req.user._id },
                        { 
                            $addToSet: { 
                                skills: { $each: extractedSkills },
                                keywords: { $each: extractedSkills }
                            },
                            openToWork: true 
                        },
                        { upsert: true, new: true }
                    );
                } catch (dbErr) {
                    console.log('Error syncing extracted skills to DB:', dbErr.message);
                }
            }

            res.status(201).json({
                message: 'File uploaded successfully',
                url: fileUrl,
                extractedSkills
            });
        });

        uploadStream.on('error', (err) => {
            res.status(500).json({ message: 'Error uploading file', error: err.message });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get file from GridFS
// @route   GET /api/upload/:filename
router.get('/:filename', async (req, res) => {
    try {
        await connectDB();
        const gfs = getGfs();
        if (!gfs) {
            return res.status(500).json({ message: 'GridFS not initialized' });
        }

        const rawFilename = req.params.filename || '';
        const sanitizedFilename = path.basename(rawFilename).replace(/[^a-zA-Z0-9._-]/g, '');
        if (!sanitizedFilename) {
            return res.status(400).json({ message: 'Invalid filename' });
        }

        const file = await gfs.find({ filename: sanitizedFilename }).toArray();
        if (!file || file.length === 0) {
            return res.status(404).json({ message: 'No file exists' });
        }

        // Set content type with robust fallback based on extension
        const fn = sanitizedFilename.toLowerCase();
        let mimeType = file[0].contentType || (file[0].metadata && file[0].metadata.contentType);
        if (!mimeType || mimeType === 'false' || mimeType === 'undefined') {
            if (fn.endsWith('.png')) mimeType = 'image/png';
            else if (fn.endsWith('.webp')) mimeType = 'image/webp';
            else if (fn.endsWith('.gif')) mimeType = 'image/gif';
            else if (fn.endsWith('.svg')) mimeType = 'image/svg+xml';
            else if (fn.endsWith('.pdf')) mimeType = 'application/pdf';
            else mimeType = 'image/jpeg';
        }
        res.set('Content-Type', mimeType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('X-Content-Type-Options', 'nosniff');

        // Read from GridFS
        const readStream = gfs.openDownloadStreamByName(sanitizedFilename);
        readStream.pipe(res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
