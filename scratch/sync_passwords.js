const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));
const URI = 'mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/alumni_db?appName=Cluster0';

async function fixPasswords() {
  await mongoose.connect(URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Alumni@6363', salt);

  const res1 = await User.updateMany(
    { email: { $in: ['harshithads2001@gmail.com', 'harshithads2001@gamil.com'] } },
    { $set: { password: hashedPassword, is_approved: true, verified: true } }
  );

  console.log('Updated users count:', res1.modifiedCount);
  
  const users = await User.find({ email: /harshithads2001/i });
  for (const u of users) {
    const match = await bcrypt.compare('Alumni@6363', u.get('password'));
    console.log('User:', u.get('email'), '| Password Match:', match, '| Approved:', u.get('is_approved'));
  }

  await mongoose.disconnect();
}

fixPasswords().catch(console.error);
