const crypto = require('crypto');

// Secret key for signing CAPTCHA challenges
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || process.env.JWT_SECRET || 'alumni_platform_secure_captcha_secret_2026';

// Replay attack prevention: stores used captcha IDs for 10 minutes
const usedCaptchaIds = new Map();

// Periodic cleanup of expired replay records
setInterval(() => {
    const now = Date.now();
    for (const [id, expiry] of usedCaptchaIds.entries()) {
        if (expiry <= now) {
            usedCaptchaIds.delete(id);
        }
    }
}, 60 * 1000).unref();

// Palette of readable yet bot-confusing colors (dark enough for white background)
const COLORS = [
    '#059669', '#2563EB', '#7C3AED', '#DB2777', '#DC2626', 
    '#D97706', '#0D9488', '#4338CA', '#15803D', '#B91C1C'
];

/**
 * Generate a random number between min and max
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random color from palette
 */
function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

/**
 * Generate visual SVG CAPTCHA with noise lines, bezier curves, and distorted text
 */
function generateCaptcha(options = {}) {
    const width = options.width || 180;
    const height = options.height || 54;
    
    // Choose between simple arithmetic (e.g. "14 + 7") or alphanumeric code (e.g. "7K9XR")
    const isMath = options.type === 'math' || Math.random() > 0.4;
    
    let answerText = '';
    let displayText = '';
    
    if (isMath) {
        const num1 = randomInt(5, 25);
        const num2 = randomInt(1, 15);
        const isAdd = Math.random() > 0.3;
        
        if (isAdd) {
            displayText = `${num1} + ${num2} = ?`;
            answerText = String(num1 + num2);
        } else {
            const high = Math.max(num1, num2);
            const low = Math.min(num1, num2);
            displayText = `${high} - ${low} = ?`;
            answerText = String(high - low);
        }
    } else {
        // Alphanumeric challenge excluding easily confused characters (0, O, 1, I, l)
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        const length = 5;
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        displayText = code;
        answerText = code;
    }

    // Generate random background noise dots
    let dots = '';
    for (let i = 0; i < 35; i++) {
        const cx = randomInt(5, width - 5);
        const cy = randomInt(5, height - 5);
        const r = (Math.random() * 2 + 1).toFixed(1);
        const color = randomColor();
        dots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="0.35"/>`;
    }

    // Generate random interference lines & bezier curves
    let lines = '';
    for (let i = 0; i < 3; i++) {
        const x1 = randomInt(0, 30);
        const y1 = randomInt(5, height - 5);
        const x2 = randomInt(width - 40, width);
        const y2 = randomInt(5, height - 5);
        const cx = randomInt(40, width - 40);
        const cy = randomInt(0, height);
        const stroke = randomColor();
        lines += `<path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" stroke="${stroke}" stroke-width="${randomInt(1, 2)}" fill="none" opacity="0.6"/>`;
    }

    // Render characters with randomized position, rotation, and skew
    const chars = displayText.split('');
    const charSpacing = (width - 30) / chars.length;
    let charsSvg = '';

    chars.forEach((char, index) => {
        const x = 16 + index * charSpacing + randomInt(-2, 2);
        const y = height / 2 + randomInt(6, 10);
        const rot = randomInt(-18, 18);
        const color = randomColor();
        const fontSize = char === '?' || char === '=' || char === '+' || char === '-' ? 20 : randomInt(22, 26);

        charsSvg += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="${color}" transform="rotate(${rot}, ${x}, ${y})">${char}</text>`;
    });

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#F8FAFC" rx="8" stroke="#E2E8F0" stroke-width="1.5"/>
    ${dots}
    ${lines}
    ${charsSvg}
</svg>
`.trim();

    // Generate cryptographic verification token
    const captchaId = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    
    // Hash answer with salt
    const answerHash = crypto
        .createHmac('sha256', CAPTCHA_SECRET)
        .update(answerText.trim().toUpperCase())
        .digest('hex');

    const payload = `${captchaId}:${expiresAt}:${answerHash}`;
    const signature = crypto
        .createHmac('sha256', CAPTCHA_SECRET)
        .update(payload)
        .digest('hex');

    const token = `${Buffer.from(payload).toString('base64')}.${signature}`;

    const captchaDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    return {
        captchaId,
        token,
        svg,
        captchaDataUrl,
        isMath,
        displayText, // for accessibility or fallback
        expiresAt
    };
}

/**
 * Verify user answer against the CAPTCHA token
 */
function verifyCaptcha(token, userAnswer) {
    if (!token || !userAnswer) {
        return { valid: false, message: 'CAPTCHA token and answer are required' };
    }

    try {
        const parts = token.split('.');
        if (parts.length !== 2) {
            return { valid: false, message: 'Malformed CAPTCHA security token' };
        }

        const [encodedPayload, clientSignature] = parts;
        const payload = Buffer.from(encodedPayload, 'base64').toString('utf8');
        const [captchaId, expiresAtStr, expectedAnswerHash] = payload.split(':');

        // 1. Verify cryptographic signature
        const expectedSignature = crypto
            .createHmac('sha256', CAPTCHA_SECRET)
            .update(payload)
            .digest('hex');

        if (clientSignature !== expectedSignature) {
            return { valid: false, message: 'Invalid CAPTCHA signature' };
        }

        // 2. Check expiration
        const expiresAt = parseInt(expiresAtStr, 10);
        if (Date.now() > expiresAt) {
            return { valid: false, message: 'CAPTCHA challenge has expired. Please refresh and try again.' };
        }

        // 3. Replay attack check: ensure token has not been used already
        if (usedCaptchaIds.has(captchaId)) {
            return { valid: false, message: 'CAPTCHA challenge already used. Please request a new one.' };
        }

        // 4. Verify user answer
        const normalizedAnswer = String(userAnswer).trim().toUpperCase();
        const computedAnswerHash = crypto
            .createHmac('sha256', CAPTCHA_SECRET)
            .update(normalizedAnswer)
            .digest('hex');

        if (computedAnswerHash !== expectedAnswerHash) {
            return { valid: false, message: 'Incorrect CAPTCHA answer. Please try again.' };
        }

        // Mark as used to prevent replay
        usedCaptchaIds.set(captchaId, expiresAt + 60 * 1000);

        return { valid: true, message: 'CAPTCHA verified successfully' };
    } catch (err) {
        return { valid: false, message: 'Failed to verify CAPTCHA: ' + err.message };
    }
}

module.exports = {
    generateCaptcha,
    verifyCaptcha
};
