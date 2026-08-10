const path = require('path');
const axios = require(path.join(__dirname, '../backend/node_modules/axios'));

async function testVercelLogins() {
  for (const email of ['harshithads2001@gmail.com', 'harshithads2001@gamil.com']) {
    try {
      const res = await axios.post('https://backend-pi-bice-97.vercel.app/api/auth/login', {
        email,
        password: 'Alumni@6363'
      }, { timeout: 10000 });
      console.log(`[SUCCESS] ${email}: Token=${Boolean(res.data.token)} Name=${res.data.name || res.data.user?.name}`);
    } catch (err) {
      console.log(`[FAILED] ${email}:`, err.response?.data || err.message);
    }
  }
}
testVercelLogins().catch(console.error);
