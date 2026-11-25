/**
 * Quick Gmail SMTP (smtp.gmail.com) Connection & OTP Delivery Verifier
 * Usage: node backend/scripts/testGmailSmtp.js [optional_recipient_email]
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sendOtpEmail, resolveSmtpConfig } = require('../utils/sendEmail');

(async () => {
    const cfg = resolveSmtpConfig();
    console.log('=== Gmail SMTP Configuration Check ===');
    console.log(`Host : ${cfg.host}`);
    console.log(`Port : ${cfg.port} (${cfg.port === 465 ? 'Implicit TLS' : 'STARTTLS'})`);
    console.log(`User : ${cfg.user}`);
    console.log(`Pass : ${cfg.pass ? `Configured (${cfg.pass.length} chars)` : 'MISSING — set GMAIL_APP_PASSWORD in backend/.env'}`);

    if (!cfg.pass) {
        process.exit(1);
    }

    const targetEmail = process.argv[2] || cfg.user;
    const sampleOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`\nSending test 6-digit OTP to ${targetEmail}...`);
    const res = await sendOtpEmail(targetEmail, sampleOtp);
    if (res.success) {
        console.log(`✅ SUCCESS! Test OTP delivered via ${res.provider} to ${targetEmail}`);
        process.exit(0);
    } else {
        console.error(`❌ FAILED:`, res.error);
        process.exit(1);
    }
})();
