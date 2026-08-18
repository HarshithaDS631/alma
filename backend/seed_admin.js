const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const directUri = 'mongodb://rveducational_db_user:Alumni%40123@ac-b8ycvdy-shard-00-00.xk6n9j6.mongodb.net:27017,ac-b8ycvdy-shard-00-01.xk6n9j6.mongodb.net:27017,ac-b8ycvdy-shard-00-02.xk6n9j6.mongodb.net:27017/?ssl=true&replicaSet=atlas-13q2t3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

const seedAdmin = async () => {
    try {
        await mongoose.connect(directUri);
        console.log('Connected to MongoDB');

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'admin@rvce.edu.in' });
        if (existingAdmin) {
            console.log('Admin already exists, updating role/institution...');
            existingAdmin.role = 'Admin';
            existingAdmin.institution = 'RV College of Engineering';
            existingAdmin.password = 'admin123'; // It will hash via pre-save
            await existingAdmin.save();
            console.log('Admin updated successfully.');
        } else {
            console.log('Creating Admin...');
            await User.create({
                name: 'RVCE Admin',
                email: 'admin@rvce.edu.in',
                password: 'admin123',
                institution: 'RV College of Engineering',
                role: 'Admin',
                isAdmin: true,
                verified: true,
                is_approved: true
            });
            console.log('RVCE Admin created successfully.');
        }

        // Seed Mediacell Admin
        const existingMediaAdmin = await User.findOne({ email: 'web.rsst@rvei.edu.in' });
        if (existingMediaAdmin) {
            console.log('Mediacell Admin already exists, updating role/institution...');
            existingMediaAdmin.role = 'Admin';
            existingMediaAdmin.institution = 'Mediacell';
            existingMediaAdmin.password = 'Media@123';
            existingMediaAdmin.is_approved = true;
            existingMediaAdmin.isAdmin = true;
            await existingMediaAdmin.save();
            console.log('Mediacell Admin updated successfully.');
        } else {
            console.log('Creating Mediacell Admin...');
            await User.create({
                name: 'Mediacell Admin',
                email: 'web.rsst@rvei.edu.in',
                password: 'Media@123',
                institution: 'Mediacell',
                role: 'Admin',
                isAdmin: true,
                verified: true,
                is_approved: true
            });
            console.log('Mediacell Admin created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
