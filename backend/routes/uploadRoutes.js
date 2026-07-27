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

        uploadStream.on('finish', () => {
            const fileUrl = `/api/upload/${filename}`;
            res.status(201).json({
                message: 'File uploaded successfully',
                url: fileUrl
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

        const file = await gfs.find({ filename: req.params.filename }).toArray();
        if (!file || file.length === 0) {
            return res.status(404).json({ message: 'No file exists' });
        }

        // Set content type
        res.set('Content-Type', file[0].contentType);

        // Read from GridFS
        const readStream = gfs.openDownloadStreamByName(req.params.filename);
        readStream.pipe(res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
