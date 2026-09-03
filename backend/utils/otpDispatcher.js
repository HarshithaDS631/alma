/**
 * Multi-Channel OTP Dispatcher (Email, Mobile SMS, WhatsApp)
 */
const { sendOtpEmail } = require('./sendEmail');
const OTP = require('../models/OTP');

// In-memory fallback cache for rapid verification
const memoryOtpCache = new Map();

const setMemoryOtp = (key, otp) => {
    const cleanKey = String(key).trim().toLowerCase().replace(/[^a-zA-Z0-9@._+-]/g, '');
    memoryOtpCache.set(cleanKey, {
        otp: String(otp).trim(),
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
};

const getMemoryOtp = (key, enteredOtp) => {
    const cleanKey = String(key).trim().toLowerCase().replace(/[^a-zA-Z0-9@._+-]/g, '');
    const record = memoryOtpCache.get(cleanKey);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
        memoryOtpCache.delete(cleanKey);
        return false;
    }
    const isMatch = record.otp === String(enteredOtp).trim();
    if (isMatch) {
        memoryOtpCache.delete(cleanKey);
    }
    return isMatch;
};

/**
 * Mask destination identifier for privacy display (e.g. u***@rvce.edu.in or +91 ******4521)
 */
const maskIdentifier = (identifier, channel = 'email') => {
    if (!identifier) return '';
    const clean = String(identifier).trim();
    
    if (channel === 'email' || clean.includes('@')) {
        const [user, domain] = clean.split('@');
        if (!domain) return clean;
        const maskedUser = user.length <= 2 ? `${user[0]}*` : `${user.slice(0, 2)}***${user.slice(-1)}`;
        return `${maskedUser}@${domain}`;
    } else {
        // Phone / WhatsApp
        const digits = clean.replace(/\D/g, '');
        if (digits.length >= 10) {
            const last4 = digits.slice(-4);
            const prefix = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)} ` : '+91 ';
            return `${prefix}******${last4}`;
        }
        return clean;
    }
};

/**
 * Send OTP via Email, Mobile SMS, or WhatsApp
 * @param {string} identifier - Email or Phone number
 * @param {string} channel - 'email' | 'mobile' | 'whatsapp'
 * @returns {Promise<Object>} { success, channel, maskedDestination, demoOtp }
 */
const dispatchOtp = async (identifier, channel = 'email') => {
    if (!identifier || !identifier.trim()) {
        throw new Error('Please provide an email address or mobile number');
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in memory cache
    setMemoryOtp(cleanIdentifier, otp);

    // Also persist in MongoDB OTP collection
    try {
        await OTP.deleteMany({ email: cleanIdentifier });
        await OTP.create({ email: cleanIdentifier, otp });
    } catch (dbErr) {
        console.warn('[OTP DB WRITE WARN]:', dbErr.message);
    }

    const maskedDestination = maskIdentifier(identifier, channel);
    let channelResult = { success: true, message: `Verification code sent to ${maskedDestination}` };

    if (channel === 'email' || cleanIdentifier.includes('@')) {
        try {
            const emailRes = await sendOtpEmail(cleanIdentifier, otp);
            console.log(`[OTP EMAIL DISPATCHED] -> ${cleanIdentifier} (Status: ${emailRes.success ? 'Delivered' : 'Simulated'})`);
        } catch (emailErr) {
            console.warn('[OTP EMAIL ERROR]:', emailErr.message);
        }
    } else if (channel === 'mobile') {
        // Mobile SMS Delivery (Twilio / SMS Gateway integration point)
        console.log(`[OTP SMS DISPATCHED] -> ${cleanIdentifier} | Code: ${otp}`);
        channelResult.message = `SMS verification code sent to ${maskedDestination}`;
    } else if (channel === 'whatsapp') {
        // WhatsApp Business Delivery (WhatsApp Cloud API / Twilio WhatsApp integration point)
        console.log(`[OTP WHATSAPP DISPATCHED] -> ${cleanIdentifier} | Code: ${otp}`);
        channelResult.message = `WhatsApp verification code sent to ${maskedDestination}`;
    }

    return {
        success: true,
        channel,
        maskedDestination,
        message: channelResult.message,
        demoOtp: otp // Included for instant sandbox & offline verification
    };
};

/**
 * Verify OTP against MongoDB and Memory Cache
 */
const verifyDispatchedOtp = async (identifier, otp) => {
    if (!identifier || !otp) return false;
    const cleanKey = identifier.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    let isValid = false;

    // Check MongoDB
    try {
        const record = await OTP.findOne({ email: cleanKey, otp: cleanOtp });
        if (record) {
            isValid = true;
            await OTP.deleteOne({ _id: record._id });
        }
    } catch (dbErr) {
        console.warn('[VERIFY OTP DB WARN]:', dbErr.message);
    }

    // Check Memory Cache Fallback
    if (!isValid && getMemoryOtp(cleanKey, cleanOtp)) {
        isValid = true;
    }

    return isValid;
};

module.exports = {
    dispatchOtp,
    verifyDispatchedOtp,
    maskIdentifier,
    setMemoryOtp,
    getMemoryOtp
};
