const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://harshithads2001:harshitha%406363@cluster0.o54c4.mongodb.net/alumni_db?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const myUser = await User.findOne({ email: 'harshithads2001@gmail.com' });
    if (myUser) {
      console.log('Found user:', myUser.name, 'with ID:', myUser._id);
      console.log('Old followers:', myUser.followers);
      console.log('Old following:', myUser.following);

      await User.updateOne({ _id: myUser._id }, { $set: { followers: [], following: [] } });
      await User.updateMany({}, { $pull: { followers: myUser._id, following: myUser._id } });
      console.log('Successfully cleared old followers and following in MongoDB Atlas!');
    }
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
