const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://rveducational_db_user:Alumni%40123@cluster0.xk6n9j6.mongodb.net/test?retryWrites=true&w=majority';

async function checkPosts() {
  await mongoose.connect(mongoUri);
  console.log('Connected to DB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Post = mongoose.model('Post', new mongoose.Schema({}, { strict: false }));

  const user = await User.findOne({ email: 'harshithads@gmail.com' });
  console.log('User ID:', user._id.toString());

  // 1. Authored Posts
  const authored = await Post.find({ user: user._id });
  console.log('\n--- AUTHORED POSTS ---');
  authored.forEach(p => console.log(JSON.stringify(p, null, 2)));

  // 2. All Posts
  const allPosts = await Post.find({});
  console.log('\n--- ALL POSTS COUNT ---', allPosts.length);
  allPosts.forEach(p => {
    console.log(`Post ID: ${p._id} | User: ${p.user} | Image: ${p.image || p.imageUrl || p.image_url} | Content: ${p.content ? p.content.substring(0, 40) : ''}`);
  });

  process.exit(0);
}

checkPosts().catch(err => { console.error(err); process.exit(1); });
