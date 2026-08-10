const path = require('path');
const axios = require(path.join(__dirname, '../backend/node_modules/axios'));

async function testLocalLogins() {
  for (const email of ['harshithads2001@gmail.com', 'harshithads2001@gamil.com']) {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password: 'Alumni@6363'
      }, { timeout: 10000 });
      console.log(`[LOCAL SUCCESS] ${email}: Token=${Boolean(res.data.token)} Name=${res.data.name || res.data.user?.name}`);
    } catch (err) {
      console.log(`[LOCAL FAILED] ${email}:`, err.response?.data || err.message);
    }
  }
}
testLocalLogins().catch(console.error);
