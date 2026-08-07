require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/alumni_db?appName=Cluster0";

async function migrateAdmins() {
    try {
        console.log('[Migration] Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;

        // 1. Find all Admin and Super Admin accounts in `users` collection
        const adminUsers = await db.collection('users').find({
            role: { $in: ['Admin', 'Super Admin', 'admin', 'superadmin', 'super_admin'] }
        }).toArray();

        console.log(`[Migration] Found ${adminUsers.length} Admin/SuperAdmin accounts in \`users\` collection.`);

        let migratedCount = 0;
        for (let adminDoc of adminUsers) {
            const adminId = adminDoc._id;
            
            // Check if already in `admins` collection
            const existingInAdmins = await db.collection('admins').findOne({ email: adminDoc.email });
            if (!existingInAdmins) {
                await db.collection('admins').insertOne(adminDoc);
                console.log(`  ✅ Migrated "${adminDoc.name}" (${adminDoc.email}) -> \`admins\` collection (ID: ObjectId('${adminId}'))`);
                migratedCount++;
            } else {
                console.log(`  ℹ️ "${adminDoc.name}" (${adminDoc.email}) is already present in \`admins\` collection.`);
            }
        }

        // 2. Remove Admin accounts from `users` collection so `users` only contains Alumni & Students
        const deleteResult = await db.collection('users').deleteMany({
            role: { $in: ['Admin', 'Super Admin', 'admin', 'superadmin', 'super_admin'] }
        });
        console.log(`\n🧹 [Users Cleanup]: Removed ${deleteResult.deletedCount} Admin accounts from \`users\` collection.`);

        // 3. Move admin activity logs into dedicated `adminactivitylogs` collection
        const adminLogs = await db.collection('activitylogs').find({
            $or: [
                { actionType: { $regex: /^ADMIN/i } },
                { endpoint: { $regex: /\/api\/admin/i } }
            ]
        }).toArray();

        console.log(`\n[Logs Migration] Found ${adminLogs.length} Admin activity logs in \`activitylogs\` collection.`);
        if (adminLogs.length > 0) {
            const existingAdminLogIds = (await db.collection('adminactivitylogs').find({}, { projection: { _id: 1 } }).toArray()).map(l => l._id.toString());
            const newAdminLogs = adminLogs.filter(l => !existingAdminLogIds.includes(l._id.toString()));

            if (newAdminLogs.length > 0) {
                await db.collection('adminactivitylogs').insertMany(newAdminLogs);
                console.log(`  ✅ Migrated ${newAdminLogs.length} admin activity log documents -> \`adminactivitylogs\` collection.`);
            }

            // Clean up admin logs from standard `activitylogs` collection
            const logDeleteResult = await db.collection('activitylogs').deleteMany({
                $or: [
                    { actionType: { $regex: /^ADMIN/i } },
                    { endpoint: { $regex: /\/api\/admin/i } }
                ]
            });
            console.log(`  🧹 Cleaned ${logDeleteResult.deletedCount} admin logs from \`activitylogs\` collection.`);
        }

        // 4. Print Summary
        const finalUsersCount = await db.collection('users').countDocuments();
        const finalAdminsCount = await db.collection('admins').countDocuments();
        const finalAdminLogsCount = await db.collection('adminactivitylogs').countDocuments();

        console.log('\n====================================================');
        console.log('🎉 SEPARATE ADMIN COLLECTIONS MIGRATION COMPLETE!');
        console.log(`📊 \`users\` collection count (Alumni & Students): ${finalUsersCount}`);
        console.log(`📊 \`admins\` collection count (Admins & Super Admins): ${finalAdminsCount}`);
        console.log(`📊 \`adminactivitylogs\` collection count: ${finalAdminLogsCount}`);
        console.log('====================================================\n');

    } catch (err) {
        console.error('[Migration Error]:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrateAdmins();
