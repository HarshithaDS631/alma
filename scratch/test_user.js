const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const User = require(path.join(__dirname, '../backend/models/User'));

async function testUserDoc() {
  await mongoose.connect('mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/alumni_db?appName=Cluster0');
  
  const userGmail = await User.findOne({ email: 'harshithads2001@gmail.com' });
  console.log('gmail user found:', Boolean(userGmail));
  if (userGmail) {
    console.log('gmail comparePassword Alumni@6363:', await userGmail.comparePassword('Alumni@6363'));
    console.log('gmail is_approved:', userGmail.is_approved);
  }

  const userGamil = await User.findOne({ email: 'harshithads2001@gamil.com' });
  console.log('gamil user found:', Boolean(userGamil));
  if (userGamil) {
    console.log('gamil comparePassword Alumni@6363:', await userGamil.comparePassword('Alumni@6363'));
    console.log('gamil is_approved:', userGamil.is_approved);
  }

  await mongoose.disconnect();
}
testUserDoc().catch(console.error);
