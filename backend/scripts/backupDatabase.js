require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/alumni_db?appName=Cluster0";

async function backupFullDatabase() {
    try {
        console.log('[MongoDB Backup] Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;

        console.log('[MongoDB Backup] Connected! Extracting all collections...');

        const collections = await db.listCollections().toArray();
        const backupData = {
            databaseName: db.databaseName,
            backupTimestamp: new Date().toISOString(),
            cluster: "cluster0.xk6n9j6.mongodb.net",
            collections: {}
        };

        let totalDocsExtracted = 0;

        for (let col of collections) {
            const colName = col.name;
            const docs = await db.collection(colName).find({}).toArray();
            backupData.collections[colName] = docs;
            totalDocsExtracted += docs.length;
            console.log(`  └─ Collection '${colName}': ${docs.length} documents exported.`);
        }

        // Ensure backups directory exists
        const backupDir = path.resolve(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `alumni_db_backup_${timestampStr}.json`;
        const backupFilePath = path.join(backupDir, backupFileName);

        fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');

        console.log(`\n🎉 FULL DATABASE BACKUP COMPLETE!`);
        console.log(`📁 Backup File Location: ${backupFilePath}`);
        console.log(`📊 Summary: ${collections.length} collections, ${totalDocsExtracted} total documents exported successfully.\n`);

    } catch (err) {
        console.error('[MongoDB Backup Error]:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

backupFullDatabase();
