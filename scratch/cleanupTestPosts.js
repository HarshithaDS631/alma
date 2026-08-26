const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://harshithads2001:harshitha%406363@cluster0.o54c4.mongodb.net/alumni_db?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    const Post = mongoose.model('Post', new mongoose.Schema({}, { strict: false }));
    const allPosts = await Post.find({});
    console.log('Total posts in database before cleanup:', allPosts.length);
    allPosts.forEach(p => {
      console.log('  ID:', p._id, '| Content:', p.content, '| hasImage:', Boolean(p.image));
    });

    const filter = {
      $or: [
        { content: { $regex: /reshare\s*test|Original\s+post/i } },
        { content: 'Original post for reshare test' },
        { content: 'Original post for reshare live verification' }
      ]
    };

    const delRes = await Post.deleteMany(filter);
    console.log('Deleted test posts count:', delRes.deletedCount);

    const remaining = await Post.find({});
    console.log('Remaining real posts:', remaining.length);
    remaining.forEach(r => {
      console.log('  Kept ID:', r._id, '| Content:', r.content);
    });

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

main();
