const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Delete obviously auto-generated test users (User123456...)
  const r1 = await User.deleteMany({ 
    name: { $regex: /^User(\s|\d)/i }, 
    email: { $regex: /test\.com/ } 
  });
  console.log('Deleted auto-generated test users:', r1.deletedCount);
  
  const remaining = await User.find({}, 'name email role institution').sort({ createdAt: -1 });
  console.log('\nRemaining users:');
  remaining.forEach(u => console.log(' -', u.name, '|', u.email, '|', u.role, '|', u.institution || ''));
  process.exit(0);
});
