require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/?appName=Cluster0";

async function migrateThreeTiers() {
    try {
        console.log('[Three-Tier Migration] Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;

        // -------------------------------------------------------------
        // STEP 1: Separate Account Collections (users, admins, superadmins)
        // -------------------------------------------------------------

        // A. Move Super Admins into `superadmins`
        const superAdminsFromUsers = await db.collection('users').find({
            role: { $in: ['Super Admin', 'superadmin', 'super_admin'] }
        }).toArray();

        const superAdminsFromAdmins = await db.collection('admins').find({
            role: { $in: ['Super Admin', 'superadmin', 'super_admin'] }
        }).toArray();

        const allSuperAdmins = [...superAdminsFromUsers, ...superAdminsFromAdmins];

        for (let saDoc of allSuperAdmins) {
            const existing = await db.collection('superadmins').findOne({ email: saDoc.email });
            if (!existing) {
                await db.collection('superadmins').insertOne(saDoc);
                console.log(`  ✅ Migrated Super Admin "${saDoc.name}" (${saDoc.email}) -> \`superadmins\` collection.`);
            }
        }

        // Clean Super Admins out of `users` and `admins`
        await db.collection('users').deleteMany({ role: { $in: ['Super Admin', 'superadmin', 'super_admin'] } });
        await db.collection('admins').deleteMany({ role: { $in: ['Super Admin', 'superadmin', 'super_admin'] } });

        // B. Ensure Admins are in `admins` and not in `users`
        const adminsFromUsers = await db.collection('users').find({
            role: { $in: ['Admin', 'admin'] }
        }).toArray();

        for (let adminDoc of adminsFromUsers) {
            const existing = await db.collection('admins').findOne({ email: adminDoc.email });
            if (!existing) {
                await db.collection('admins').insertOne(adminDoc);
                console.log(`  ✅ Migrated Admin "${adminDoc.name}" (${adminDoc.email}) -> \`admins\` collection.`);
            }
        }

        await db.collection('users').deleteMany({ role: { $in: ['Admin', 'admin'] } });

        // -------------------------------------------------------------
        // STEP 2: Separate Activity Log Collections
        // (useractivitylogs, adminactivitylogs, superadminactivitylogs)
        // -------------------------------------------------------------

        // Collect all existing logs from `activitylogs` or previous collections
        const oldLogs = await db.collection('activitylogs').find({}).toArray();
        if (oldLogs.length > 0) {
            console.log(`\n[Logs Migration] Migrating ${oldLogs.length} documents from \`activitylogs\` -> \`useractivitylogs\`...`);
            const existingUserLogIds = (await db.collection('useractivitylogs').find({}, { projection: { _id: 1 } }).toArray()).map(l => l._id.toString());
            const newLogs = oldLogs.filter(l => !existingUserLogIds.includes(l._id.toString()));
            if (newLogs.length > 0) {
                await db.collection('useractivitylogs').insertMany(newLogs);
            }
            await db.collection('activitylogs').drop().catch(() => {});
        }

        // Get all Super Admin IDs & Emails
        const superAdminDocs = await db.collection('superadmins').find({}).toArray();
        const superAdminIds = superAdminDocs.map(s => s._id.toString());
        const superAdminEmails = superAdminDocs.map(s => (s.email || '').toLowerCase());

        // Get all Admin IDs & Emails
        const adminDocs = await db.collection('admins').find({}).toArray();
        const adminIds = adminDocs.map(a => a._id.toString());
        const adminEmails = adminDocs.map(a => (a.email || '').toLowerCase());

        // Separate adminactivitylogs into superadminactivitylogs if Super Admin action
        const adminLogsToFilter = await db.collection('adminactivitylogs').find({}).toArray();
        let movedToSuperAdminLogs = 0;

        for (let log of adminLogsToFilter) {
            const logUserId = log.admin ? log.admin.toString() : (log.user ? log.user.toString() : '');
            const logEmail = (log.adminEmail || log.userEmail || '').toLowerCase();

            const isSuperAdminAction = superAdminIds.includes(logUserId) ||
                superAdminEmails.includes(logEmail) ||
                (log.metadata && log.metadata.role === 'Super Admin');

            if (isSuperAdminAction) {
                const existingInSALog = await db.collection('superadminactivitylogs').findOne({ _id: log._id });
                if (!existingInSALog) {
                    await db.collection('superadminactivitylogs').insertOne({
                        ...log,
                        superAdmin: log.admin || log.user,
                        superAdminEmail: log.adminEmail || log.userEmail,
                        superAdminName: log.adminName || log.userName
                    });
                    await db.collection('adminactivitylogs').deleteOne({ _id: log._id });
                    movedToSuperAdminLogs++;
                }
            }
        }
        console.log(`  ✅ Moved ${movedToSuperAdminLogs} Super Admin activity logs -> \`superadminactivitylogs\` collection.`);

        // -------------------------------------------------------------
        // STEP 3: Summary Report
        // -------------------------------------------------------------
        const countUsers = await db.collection('users').countDocuments();
        const countAdmins = await db.collection('admins').countDocuments();
        const countSuperAdmins = await db.collection('superadmins').countDocuments();

        const countUserLogs = await db.collection('useractivitylogs').countDocuments();
        const countAdminLogs = await db.collection('adminactivitylogs').countDocuments();
        const countSuperAdminLogs = await db.collection('superadminactivitylogs').countDocuments();

        console.log('\n================================================================');
        console.log('🎉 STRICT 3-TIER COLLECTION SEPARATION COMPLETE!');
        console.log('----------------------------------------------------------------');
        console.log('👤 ACCOUNTS COLLECTIONS:');
        console.log(`   └─ \`users\` (Alumni & Students): ${countUsers} accounts`);
        console.log(`   └─ \`admins\` (Admins): ${countAdmins} accounts`);
        console.log(`   └─ \`superadmins\` (Super Admins): ${countSuperAdmins} accounts`);
        console.log('\n📊 ACTIVITY LOG COLLECTIONS:');
        console.log(`   └─ \`useractivitylogs\` (User Actions): ${countUserLogs} logs`);
        console.log(`   └─ \`adminactivitylogs\` (Admin Actions): ${countAdminLogs} logs`);
        console.log(`   └─ \`superadminactivitylogs\` (Super Admin Actions): ${countSuperAdminLogs} logs`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('[Migration Error]:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrateThreeTiers();
