const path = require('path');
const axios = require(path.join(__dirname, '../backend/node_modules/axios'));

async function checkHealth() {
  try {
    const res = await axios.get('https://backend-pi-bice-97.vercel.app/api/health');
    console.log('VERCEL DB HEALTH:', res.data);
  } catch (err) {
    console.log('Error:', err.message);
  }
}
checkHealth().catch(console.error);
