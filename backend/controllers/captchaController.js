const { generateCaptcha, verifyCaptcha } = require('../services/captchaService');

// @desc    Generate a new visual CAPTCHA challenge
// @route   GET /api/auth/captcha
// @access  Public
exports.getCaptcha = (req, res) => {
    try {
        const type = req.query.type || 'mixed';
        const captcha = generateCaptcha({ type });

        res.json({
            success: true,
            captchaId: captcha.captchaId,
            svg: captcha.svg,
            captchaDataUrl: captcha.captchaDataUrl,
            token: captcha.token,
            isMath: captcha.isMath,
            prompt: captcha.isMath 
                ? 'Solve the math problem shown in the security image' 
                : 'Type the 5 characters shown in the security image',
            expiresAt: captcha.expiresAt
        });
    } catch (err) {
        console.error('[CAPTCHA GENERATION ERROR]:', err);
        res.status(500).json({ success: false, message: 'Failed to generate CAPTCHA security challenge' });
    }
};

// @desc    Verify a CAPTCHA solution
// @route   POST /api/auth/verify-captcha
// @access  Public
exports.checkCaptcha = (req, res) => {
    try {
        const { token, answer } = req.body;
        if (!token || !answer) {
            return res.status(400).json({ success: false, message: 'Security token and answer are required' });
        }

        const result = verifyCaptcha(token, answer);
        if (result.valid) {
            return res.json({ success: true, message: 'CAPTCHA verified successfully' });
        } else {
            return res.status(400).json({ success: false, message: result.message });
        }
    } catch (err) {
        console.error('[CAPTCHA VERIFY ERROR]:', err);
        res.status(500).json({ success: false, message: 'Internal CAPTCHA verification error' });
    }
};
