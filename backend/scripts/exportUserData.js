require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/?appName=Cluster0";

async function exportUserData() {
    const queryTerm = process.argv[2];

    if (!queryTerm) {
        console.log('\n❌ Please provide an Email or User ID to export.');
        console.log('Usage: node scripts/exportUserData.js <user_email_or_id>\n');
        console.log('Example: node scripts/exportUserData.js harshithads2001@gmail.com');
        process.exit(1);
    }

    try {
        console.log(`[Export] Connecting to MongoDB Atlas...`);
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;

        // 1. Find User by Email or ObjectId
        let userFilter = { email: queryTerm.trim().toLowerCase() };
        if (mongoose.Types.ObjectId.isValid(queryTerm)) {
            userFilter = { $or: [{ email: queryTerm.trim().toLowerCase() }, { _id: new mongoose.Types.ObjectId(queryTerm) }] };
        }

        const user = await db.collection('users').findOne(userFilter);

        if (!user) {
            console.log(`❌ No user found matching: "${queryTerm}"`);
            process.exit(1);
        }

        console.log(`\n✅ User Found: "${user.name}" (${user.email}) | ID: ${user._id}`);

        const userId = user._id;

        // 2. Fetch associated data across collections
        const userPosts = await db.collection('posts').find({ user: userId }).toArray();
        const userMessages = await db.collection('messages').find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).toArray();
        const userNotifications = await db.collection('notifications').find({ recipient: userId }).toArray();
        const userLogs = await db.collection('activitylogs').find({ user: userId }).toArray();

        // 3. Assemble Export Data Object
        const exportPayload = {
            exportTimestamp: new Date().toISOString(),
            userProfile: user,
            statistics: {
                totalPosts: userPosts.length,
                totalMessages: userMessages.length,
                totalNotifications: userNotifications.length,
                totalActivityLogs: userLogs.length
            },
            posts: userPosts,
            messages: userMessages,
            notifications: userNotifications,
            activityLogs: userLogs
        };

        // 4. Ensure Exports Directory Exists & Save JSON File
        const exportDir = path.resolve(__dirname, '../exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const safeFilename = `user_export_${(user.name || 'user').replace(/[^a-zA-Z0-9]/g, '_')}_${userId}.json`;
        const outputPath = path.join(exportDir, safeFilename);

        fs.writeFileSync(outputPath, JSON.stringify(exportPayload, null, 2), 'utf8');

        console.log(`\n🎉 SUCCESS! User data exported successfully.`);
        console.log(`📁 Saved to: ${outputPath}`);
        console.log(`📊 Summary: ${userPosts.length} posts, ${userMessages.length} messages exported.\n`);

    } catch (err) {
        console.error('[Export Error]:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

exportUserData();
