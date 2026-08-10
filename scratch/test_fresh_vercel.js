const path = require('path');
const axios = require(path.join(__dirname, '../backend/node_modules/axios'));

async function testFreshVercelDeployment() {
  const url = 'https://backend-admf0cs6d-harshithads2001-2830s-projects.vercel.app/api/auth/login';
  for (const email of ['harshithads2001@gmail.com', 'harshithads2001@gamil.com']) {
    try {
      const res = await axios.post(url, {
        email,
        password: 'Alumni@6363'
      }, { timeout: 10000 });
      console.log(`[VERCEL DEPLOY SUCCESS] ${email}: Token=${Boolean(res.data.token)} Name=${res.data.name || res.data.user?.name}`);
    } catch (err) {
      console.log(`[VERCEL DEPLOY FAILED] ${email}:`, err.response?.data || err.message);
    }
  }
}
testFreshVercelDeployment().catch(console.error);
