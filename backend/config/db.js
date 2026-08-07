const mongoose = require('mongoose');

// Cache the connection promise to avoid re-connecting on every Vercel serverless invocation
let connectionPromise = null;

mongoose.connection.on('error', (err) => {
    console.error(`MongoDB Connection Error: ${err.message}`);
    connectionPromise = null; // Reset so next request tries to reconnect
});

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!connectionPromise || mongoose.connection.readyState === 0) {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/alumni_db?appName=Cluster0';
        connectionPromise = mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            autoIndex: false,
            heartbeatFrequencyMS: 10000
        }).then((conn) => {
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return conn;
        }).catch((error) => {
            connectionPromise = null;
            console.error(`Database Connection Error: ${error.message}`);
            throw error;
        });
    }

    await connectionPromise;
    return mongoose.connection;
};

module.exports = connectDB;
