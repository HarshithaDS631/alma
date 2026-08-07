const mongoose = require('mongoose');

// Cache the connection promise to avoid re-connecting on every Vercel serverless invocation
let connectionPromise = null;

mongoose.connection.on('error', (err) => {
    console.error(`MongoDB Connection Error: ${err.message}`);
    connectionPromise = null; // Reset so next request tries to reconnect
});

// Always force process.env.MONGO_URI to target 'alumni_db'
if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('alumni_db')) {
    process.env.MONGO_URI = process.env.MONGO_URI.replace('.mongodb.net/?', '.mongodb.net/alumni_db?');
    if (!process.env.MONGO_URI.includes('alumni_db')) {
        process.env.MONGO_URI = process.env.MONGO_URI.replace('.mongodb.net/', '.mongodb.net/alumni_db');
    }
}

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/alumni_db?appName=Cluster0';

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    
    if (!connectionPromise || mongoose.connection.readyState === 0) {
        connectionPromise = mongoose.connect(mongoUri, {
            dbName: 'alumni_db',
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            autoIndex: false
        }).catch((err) => {
            connectionPromise = null;
            throw err;
        });
    }

    await connectionPromise;

    // Ensure connection is fully established before returning
    if (mongoose.connection.readyState !== 1) {
        await new Promise((resolve) => {
            if (mongoose.connection.readyState === 1) return resolve();
            mongoose.connection.once('connected', resolve);
            setTimeout(resolve, 3000);
        });
    }

    return mongoose.connection;
};

module.exports = connectDB;
