const mongoose = require('mongoose');

// Cache the connection promise to avoid re-connecting on every Vercel serverless invocation
let connectionPromise = null;

mongoose.connection.on('error', (err) => {
    console.error(`MongoDB Connection Error: ${err.message}`);
    connectionPromise = null; // Reset so next request tries to reconnect
});

const connectDB = async () => {
    // If already connected, return immediately (O(1) check)
    if (mongoose.connection.readyState === 1) {
        return;
    }

    // If a connection is already in progress, wait for it (avoid duplicate connects)
    if (connectionPromise) {
        return connectionPromise;
    }

    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/alumni_db?appName=Cluster0';

    connectionPromise = mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,  // Fail fast if Atlas is unreachable
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        autoIndex: false,                // Disable auto-index on Vercel (speeds up cold start)
        heartbeatFrequencyMS: 10000
    }).then((conn) => {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    }).catch((error) => {
        connectionPromise = null;       // Reset on failure so next request retries
        console.error(`Database Connection Error: ${error.message}`);
        throw error;
    });

    return connectionPromise;
};

module.exports = connectDB;
