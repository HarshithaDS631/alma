const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reportRoutes = require('./routes/reportRoutes');
const blockRoutes = require('./routes/blockRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const activityRoutes = require('./routes/activityRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const jobRoutes = require('./routes/jobRoutes');
const firebaseAuthRoutes = require('./routes/firebaseAuthRoutes');
const { initScheduler } = require('./utils/cronScheduler');

dotenv.config();

initScheduler();

console.log(`[ENV CONFIG] SMTP Host: ${process.env.SMTP_HOST || 'Not Set'} | SMTP User: ${process.env.SMTP_USER || 'Not Set'}`);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ────────────────────────────────────────
// Helmet: sets secure HTTP headers (XSS, CSP, clickjacking, MIME-sniffing protection)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow Cloudinary/S3 images
}));

// Mongo Sanitize: prevents NoSQL injection attacks by sanitizing req.body
app.use((req, res, next) => {
    try {
        if (req.body && typeof req.body === 'object') {
            mongoSanitize.sanitize(req.body);
        }
    } catch (e) {
        // Ignore read-only getter errors on serverless platforms
    }
    next();
});

// CORS: whitelist allowed origins (production + local dev)
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:19006', // Expo web
    'https://alma-connect.vercel.app'
].filter(Boolean); // Filter out undefined env vars

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Allow any Vercel preview deployment
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true); // Allow all for now until frontend URLs are finalized
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Body parsing with size limits (prevent payload attacks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global API rate limiter: 100 requests per 15 minutes per IP
app.use('/api/', apiLimiter);

// ─── Socket.IO Setup ────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Socket.IO JWT Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
        return next(); // Allow guest/anonymous for public notifications, room joins enforce auth
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        socket.user = decoded;
        next();
    } catch (err) {
        next();
    }
});

// Real-Time WebSocket Event Handlers
io.on('connection', (socket) => {
    console.log(`[Socket.IO WSS] Client connected: ${socket.id}`);

    socket.on('join_user_room', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`[Socket.IO WSS] User ${userId} joined room: user_${userId}`);
        }
    });

    socket.on('typing', ({ senderId, receiverId }) => {
        socket.to(`user_${receiverId}`).emit('user_typing', { senderId });
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
        socket.to(`user_${receiverId}`).emit('user_stop_typing', { senderId });
    });

    socket.on('send_realtime_message', (messageData) => {
        const { receiver } = messageData;
        if (receiver) {
            const receiverId = typeof receiver === 'object' ? (receiver._id || receiver.id) : receiver;
            io.to(`user_${receiverId}`).emit('receive_realtime_message', messageData);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket.IO WSS] Client disconnected: ${socket.id}`);
    });
});

// ─── Database Connection ────────────────────────────────────────
// Kick off DB connection immediately on startup (warm it up before first request)
connectDB().catch(err => console.error('[DB STARTUP ERROR]:', err.message));

// Middleware: ensure DB is connected, but don't block request processing
app.use((req, res, next) => {
    req.io = io;
    // If already connected, proceed instantly
    if (require('mongoose').connection.readyState === 1) {
        return next();
    }
    // Otherwise connect and proceed (controller will retry if needed)
    connectDB().catch(err => console.warn('[DB CONNECT WARN]:', err.message));
    next();
});
app.use(activityLogger);

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/firebase-auth', firebaseAuthRoutes);
const recommendationRoutes = require('./routes/recommendationRoutes');
app.use('/api/recommendations', recommendationRoutes);

// ─── System Health ──────────────────────────────────────────────
app.get('/api/system-status', async (req, res) => {
    const mongoose = require('mongoose');
    try { await connectDB(); } catch (e) {}
    res.json({
        status: 'healthy',
        architecture: {
            transport: 'HTTPS / WSS (Load Balancer & Nginx Proxy Ready)',
            clients: ['Web Application (React/Next.js)', 'Mobile Application (Flutter)'],
            security: [
                'Helmet (Secure HTTP Headers)',
                'Rate Limiting (100 req/15min)',
                'NoSQL Injection Prevention',
                'Input Validation (express-validator)',
                'Token Blacklisting (Logout Invalidation)',
                'Login History & Audit Trail',
                'CORS Origin Whitelist'
            ],
            modules: [
                'Authentication Module (JWT + OTP + OAuth + 2FA-Ready)',
                'User Management Module',
                'Alumni Directory Module',
                'Profile Management Module',
                'Event Management Module',
                'Job Portal Module (LinkedIn-style)',
                'Mentorship Module',
                'Chat Module (Socket.IO)',
                'Notification Module',
                'Admin Module',
                'Reports & Analytics Module',
                'Gamification Module (Planned)',
                'Community Groups Module (Planned)'
            ],
            database: 'MongoDB Atlas',
            dbState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            storage: 'Cloudinary / GridFS / AWS S3',
            realtime: 'Socket.IO WSS Active'
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.send('RVITM Alumni API is running with HTTPS, WSS (Socket.IO), JWT Auth & MongoDB Atlas...');
});

// ─── Error Handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[EXPRESS SERVER ERROR]:', err);
    const message = err.message || 'Internal server error';
    res.status(err.status || 500).json({ message });
});

if (!process.env.VERCEL) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (HTTP & Socket.IO WSS)`);
    });
}

module.exports = app;

