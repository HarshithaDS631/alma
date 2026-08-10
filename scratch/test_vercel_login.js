const path = require('path');
const axios = require(path.join(__dirname, '../backend/node_modules/axios'));

async function testVercelLogin() {
  try {
    const res = await axios.post('https://backend-pi-bice-97.vercel.app/api/auth/login', {
      email: 'harshithads2001@gmail.com',
      password: 'Alumni@6363'
    }, { timeout: 10000 });
    console.log('VERCEL LOGIN SUCCESSFUL!');
    console.log('Token received:', Boolean(res.data.token));
    console.log('User Name:', res.data.name || res.data.user?.name);
  } catch (err) {
    console.log('Vercel login error:', err.response?.data || err.message);
  }
}
testVercelLogin().catch(console.error);
