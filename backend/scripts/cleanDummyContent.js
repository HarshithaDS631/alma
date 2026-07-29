require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/?appName=Cluster0";

async function cleanDummyContent() {
    try {
        console.log('[MongoDB Cleanup] Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI);
        console.log('[MongoDB Cleanup] Connected successfully!');

        const db = mongoose.connection.db;

        // 1. Inspect Collections
        const collections = await db.listCollections().toArray();
        console.log('\n--- Existing Collections & Counts ---');
        for (let col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

        // 2. Identify & Remove Dummy Users
        const usersCol = db.collection('users');
        const dummyUserPatterns = [
            { email: /test/i },
            { email: /dummy/i },
            { email: /example/i },
            { name: /test/i },
            { name: /dummy/i },
            { name: /sample/i }
        ];

        const dummyUsersResult = await usersCol.deleteMany({
            $or: dummyUserPatterns
        });
        console.log(`\n[Clean Users]: Removed ${dummyUsersResult.deletedCount} dummy/test user documents.`);

        // 3. Identify & Remove Dummy / Orphaned Posts
        const postsCol = db.collection('posts');
        const validUserIds = (await usersCol.find({}, { projection: { _id: 1 } }).toArray()).map(u => u._id.toString());
        
        const allPosts = await postsCol.find({}).toArray();
        const orphanedPostIds = allPosts
            .filter(p => !p.user || !validUserIds.includes(p.user.toString()) || /^[a-z]{8,}$/i.test((p.content || '').trim()))
            .map(p => p._id);

        if (orphanedPostIds.length > 0) {
            const dummyPostsResult = await postsCol.deleteMany({ _id: { $in: orphanedPostIds } });
            console.log(`[Clean Posts]: Removed ${dummyPostsResult.deletedCount} dummy/orphaned post documents.`);
        }

        // 4. Identify & Remove Orphaned / Dummy Messages
        const messagesCol = db.collection('messages');
        const dummyMessagesResult = await messagesCol.deleteMany({
            $or: [
                { text: /test/i },
                { text: /dummy/i },
                { text: /hello world/i }
            ]
        });
        console.log(`[Clean Messages]: Removed ${dummyMessagesResult.deletedCount} test message documents.`);

        // 5. Clean Dummy Notifications
        const notifCol = db.collection('notifications');
        const dummyNotifResult = await notifCol.deleteMany({
            $or: [
                { message: /test/i },
                { message: /dummy/i }
            ]
        });
        console.log(`[Clean Notifications]: Removed ${dummyNotifResult.deletedCount} test notification documents.`);

        // 6. Summary of remaining clean state
        console.log('\n--- Remaining Collection Counts ---');
        for (let col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

        console.log('\n[MongoDB Cleanup] All dummy content successfully purged from MongoDB Atlas!');
    } catch (err) {
        console.error('[MongoDB Cleanup Error]:', err);
    } finally {
        await mongoose.disconnect();
        console.log('[MongoDB Cleanup] Disconnected from MongoDB Atlas.');
        process.exit(0);
    }
}

cleanDummyContent();
