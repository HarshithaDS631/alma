const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendFCMNotification } = require('./fcmService');

async function testPush() {
    console.log('Testing FCM Push Notification setup...');
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey || serverKey === 'YOUR_FCM_SERVER_KEY_HERE') {
        console.log('⚠️ FCM_SERVER_KEY is not configured yet in backend/.env');
        console.log('Please add your FCM Server Key to backend/.env to send live push notifications.');
        return;
    }
    console.log('✅ FCM_SERVER_KEY detected!');
    // Test FCM dispatch simulation / API
    await sendFCMNotification('test_device_token', '🎂 Test Birthday Notification', 'Happy Birthday! Testing Firebase Push Notification system.', { type: 'birthday' });
}

testPush();
