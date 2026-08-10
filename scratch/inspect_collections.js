const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const User = require(path.join(__dirname, '../backend/models/User'));
const AdminUser = require(path.join(__dirname, '../backend/models/AdminUser'));
const SuperAdminUser = require(path.join(__dirname, '../backend/models/SuperAdminUser'));
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));

async function inspectAllCollections() {
  await mongoose.connect('mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/alumni_db?appName=Cluster0');
  
  console.log('--- USER COLLECTION ---');
  const users = await User.find({ email: /harshithads2001/i });
  for (const u of users) {
    console.log('User:', u.email, '| ID:', u._id, '| Role:', u.role, '| Approved:', u.is_approved);
    console.log('  Password Match Alumni@6363:', await bcrypt.compare('Alumni@6363', u.password));
  }

  console.log('--- ADMIN COLLECTION ---');
  const admins = await AdminUser.find({ email: /harshithads2001/i });
  for (const a of admins) {
    console.log('Admin:', a.email, '| ID:', a._id);
  }

  console.log('--- SUPERADMIN COLLECTION ---');
  const supers = await SuperAdminUser.find({ email: /harshithads2001/i });
  for (const s of supers) {
    console.log('Super:', s.email, '| ID:', s._id);
  }

  await mongoose.disconnect();
}
inspectAllCollections().catch(console.error);
