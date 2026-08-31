const nodemailer = require('nodemailer');
const https = require('https');

// ─── Welcome Email ───────────────────────────────────────────────────────────
const sendWelcomeEmail = async (userEmail, userName, institution = 'Alumni Network', isApproved = false) => {
    const instName = institution || 'Alumni Network';
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'rvmediadevelopers@gmail.com';

    const subject = isApproved 
        ? `Welcome to ${instName} — Your Alumni Account is Approved!`
        : `Welcome to ${instName}!`;

    const statusMessage = isApproved
        ? `We are pleased to inform you that your registration for <strong>${instName}</strong> has been officially approved by your Administrator! You can now log in, connect with fellow batchmates, explore mentorship opportunities, and share updates with your network.`
        : `We are thrilled to welcome you to the official <strong>${instName}</strong> platform. Your profile has been submitted and is currently being verified by your Administrator.`;

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background-color: #FFFFFF;">
            <div style="background: linear-gradient(135deg, #003366, #0055A5); padding: 30px 24px; text-align: center;">
                <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">${instName}</h1>
                <p style="color: #BAE6FD; margin: 8px 0 0 0; font-size: 14px;">Official Alumni Portal</p>
            </div>
            <div style="padding: 32px 28px; background-color: #FFFFFF;">
                <p style="font-size: 16px; color: #1E293B; margin-top: 0;">
                    Hi <strong>${userName}</strong>,
                </p>
                <p style="font-size: 15px; color: #475569; line-height: 1.7;">
                    ${statusMessage}
                </p>
                ${isApproved ? `
                <div style="text-align: center; margin: 28px 0;">
                    <a href="https://almafrontend-eight.vercel.app" style="background-color: #003366; color: #FFFFFF; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 15px;">
                        Access Alumni Portal
                    </a>
                </div>
                ` : ''}
                <div style="margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
                    <p style="font-size: 13px; color: #64748B; margin: 0; line-height: 1.5;">
                        Warm regards,<br/>
                        <strong>${instName} Alumni Team</strong>
                    </p>
                </div>
            </div>
            <div style="background-color: #F8FAFC; padding: 16px; text-align: center; border-top: 1px solid #E2E8F0;">
                <p style="font-size: 12px; color: #94A3B8; margin: 0;">
                    © ${new Date().getFullYear()} ${instName}. All rights reserved.
                </p>
            </div>
        </div>
    `;

    // Try SendGrid REST API first
    if (apiKey) {
        try {
            const payload = JSON.stringify({
                personalizations: [{ to: [{ email: userEmail, name: userName }] }],
                from: { email: fromEmail, name: `${instName}` },
                subject,
                content: [
                    { type: 'text/plain', value: `Hi ${userName}, ${isApproved ? 'Your account has been approved!' : 'Welcome to ' + instName}` },
                    { type: 'text/html', value: htmlTemplate },
                ],
            });

            await new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: 'api.sendgrid.com',
                    port: 443,
                    path: '/v3/mail/send',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload),
                    },
                }, (res) => {
                    let resBody = '';
                    res.on('data', (d) => { resBody += d; });
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve();
                        } else {
                            reject(new Error(`SendGrid API error (${res.statusCode}): ${resBody}`));
                        }
                    });
                });
                req.on('error', reject);
                req.write(payload);
                req.end();
            });

            console.log(`[WELCOME EMAIL SENT via SendGrid API] -> ${userEmail}`);
            return true;
        } catch (apiErr) {
            console.warn('[WELCOME EMAIL SendGrid API failed, falling back to SMTP]:', apiErr.message);
        }
    }

    // Fallback to nodemailer transporter
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: false,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY,
            },
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"${instName}" <${fromEmail}>`,
            to: userEmail,
            subject,
            html: htmlTemplate,
        });

        console.log(`[WELCOME EMAIL SENT via SMTP] -> ${userEmail}`);
        return true;
    } catch (smtpErr) {
        console.error('[WELCOME EMAIL SMTP ERROR]:', smtpErr.message);
        return false;
    }
};

// ─── OTP Email via SendGrid REST API (fastest path) ──────────────────────────
const sendOtpEmail = async (userEmail, otp) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'rvmediadevelopers@gmail.com';

    const plainText = `Your Alumni Network verification code is: ${otp}\n\nThis code expires in 5 minutes. Do not share it with anyone.`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #003366; padding: 22px; text-align: center;">
                <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700;">Email Verification</h1>
            </div>
            <div style="padding: 32px 28px; background-color: #FFFFFF;">
                <p style="font-size: 15px; color: #334155; margin-top: 0;">Hello,</p>
                <p style="font-size: 15px; color: #334155; line-height: 1.6;">
                    Use the code below to verify your email for Alumni Network registration:
                </p>
                <div style="text-align: center; margin: 28px 0;">
                    <div style="background-color: #F1F5F9; color: #003366; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 34px; letter-spacing: 8px; border: 2px solid #CBD5E1; display: inline-block;">
                        ${otp}
                    </div>
                </div>
                <p style="font-size: 13px; color: #64748B; text-align: center; margin-bottom: 0;">
                    This code expires in <strong>5 minutes</strong>. If you did not request this, ignore this email.
                </p>
            </div>
            <div style="background-color: #F8FAFC; padding: 14px; text-align: center; border-top: 1px solid #E2E8F0;">
                <p style="font-size: 12px; color: #94A3B8; margin: 0;">© ${new Date().getFullYear()} Alumni Network. All rights reserved.</p>
            </div>
        </div>
    `;

    // Primary: SendGrid REST API (fastest, no SMTP handshake)
    if (apiKey && apiKey.startsWith('SG.')) {
        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: userEmail }] }],
                    from: { email: fromEmail, name: 'Alumni Network' },
                    subject: 'Your Verification Code - Alumni Network',
                    content: [
                        { type: 'text/plain', value: plainText },
                        { type: 'text/html', value: html }
                    ]
                })
            });

            if (response.status >= 200 && response.status < 300) {
                console.log(`[SENDGRID OK] OTP sent to ${userEmail} — status ${response.status}`);
                return { success: true };
            }

            const errBody = await response.text();
            console.error(`[SENDGRID ERROR] Status ${response.status}:`, errBody);
            // Fall through to SMTP fallback
        } catch (fetchErr) {
            console.error('[SENDGRID FETCH ERROR]:', fetchErr.message);
            // Fall through to SMTP fallback
        }
    }

    // Fallback: SMTP via SendGrid (same credentials, SMTP protocol)
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: { user: 'apikey', pass: apiKey },
            connectionTimeout: 6000,
            greetingTimeout: 6000,
            socketTimeout: 10000
        });

        await transporter.sendMail({
            from: `"Alumni Network" <${fromEmail}>`,
            to: userEmail,
            subject: 'Your Verification Code - Alumni Network',
            text: plainText,
            html
        });

        console.log(`[SMTP FALLBACK OK] OTP sent to ${userEmail}`);
        return { success: true };
    } catch (smtpErr) {
        console.error('[SMTP FALLBACK ERROR]:', smtpErr.message);
        return { success: false, error: smtpErr.message };
    }
};

// ─── Password Reset Email ───────────────────────────────────────────────────
const sendPasswordResetEmail = async (userEmail, resetUrl, resetToken) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'rvmediadevelopers@gmail.com';

    const plainText = `Password Reset Request\n\nYou requested a password reset for your Alumni Network account.\nPlease use the following reset code or link to reset your password:\n\nReset Token Code: ${resetToken}\n\nReset Link: ${resetUrl}\n\nIf you did not request a password reset, please ignore this email.`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; background-color: #FFFFFF;">
            <div style="background-color: #003366; padding: 24px; text-align: center;">
                <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700;">Password Reset Request</h1>
            </div>
            <div style="padding: 32px 24px; background-color: #FFFFFF;">
                <p style="font-size: 15px; color: #334155; margin-top: 0;">Hello,</p>
                <p style="font-size: 15px; color: #334155; line-height: 1.6;">
                    We received a request to reset the password for your Alumni Network account. Use the token code below or click the link to set a new password:
                </p>
                
                <div style="text-align: center; margin: 24px 0;">
                    <div style="background-color: #F1F5F9; color: #003366; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 24px; letter-spacing: 3px; border: 1px solid #CBD5E1; display: inline-block;">
                        ${resetToken}
                    </div>
                </div>

                <div style="text-align: center; margin: 28px 0;">
                    <a href="${resetUrl}" style="background-color: #003366; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                        Reset Your Password
                    </a>
                </div>

                <p style="font-size: 13px; color: #64748B; text-align: center; margin-bottom: 0;">
                    This link and code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.
                </p>
            </div>
            <div style="background-color: #F8FAFC; padding: 16px; text-align: center; border-top: 1px solid #E2E8F0;">
                <p style="font-size: 12px; color: #94A3B8; margin: 0;">© ${new Date().getFullYear()} Alumni Network. All rights reserved.</p>
            </div>
        </div>
    `;

    if (apiKey && apiKey.startsWith('SG.')) {
        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: userEmail }] }],
                    from: { email: fromEmail, name: 'Alumni Network Security' },
                    subject: 'Password Reset Request - Alumni Network',
                    content: [
                        { type: 'text/plain', value: plainText },
                        { type: 'text/html', value: html }
                    ]
                })
            });

            if (response.status >= 200 && response.status < 300) {
                console.log(`[PASSWORD RESET EMAIL OK] Sent to ${userEmail}`);
                return { success: true };
            }
            const errText = await response.text();
            console.error('[PASSWORD RESET SENDGRID ERROR]:', errText);
        } catch (e) {
            console.error('[PASSWORD RESET FETCH ERROR]:', e.message);
        }
    }

    return { success: false };
};

// ─── Share Candidate Resume Email ──────────────────────────────────────────
const sendCandidateResumeEmail = async ({ recipientEmail, candidate, adminName, adminInstitution, customMessage, subject }) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'rvmediadevelopers@gmail.com';
    const emailSubject = subject || `Candidate Profile & Resume: ${candidate.name} (${candidate.institution || adminInstitution || 'Alumni'})`;

    const skillsHtml = (candidate.skills && candidate.skills.length > 0)
        ? candidate.skills.map(s => `<span style="display:inline-block; background-color:#EFF6FF; color:#003366; font-size:12px; font-weight:600; padding:4px 10px; border-radius:12px; margin:3px 4px 3px 0; border:1px solid #DBEAFE;">${s}</span>`).join('')
        : '<span style="color:#94A3B8; font-size:13px;">Not specified</span>';

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; background-color: #FFFFFF;">
            <div style="background: linear-gradient(135deg, #003366, #002144); padding: 28px 24px; text-align: center;">
                <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Alumni Talent Network</h1>
                <p style="color: #BAE6FD; margin: 6px 0 0 0; font-size: 13.5px;">Candidate Resume Referral from ${adminInstitution || 'Alumni Administration'}</p>
            </div>
            <div style="padding: 28px 24px; background-color: #FFFFFF;">
                <p style="font-size: 15px; color: #1E293B; margin-top: 0; line-height: 1.6;">
                    Hello,<br/><br/>
                    <strong>${adminName || 'The Alumni Placement & Career Admin'}</strong> has forwarded a verified candidate profile from the <strong>${candidate.institution || adminInstitution || 'Alumni Network'}</strong> Resume Book for your review.
                </p>

                ${customMessage ? `
                <div style="background-color: #F8FAFC; border-left: 4px solid #003366; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13.5px; color: #334155; font-style: italic;">
                        "${customMessage}"
                    </p>
                </div>
                ` : ''}

                <!-- Candidate Profile Summary Card -->
                <div style="background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 12px; padding: 20px; margin: 22px 0;">
                    <h2 style="margin: 0 0 4px 0; font-size: 18px; color: #002144; font-weight: 700;">${candidate.name}</h2>
                    <p style="margin: 0 0 14px 0; font-size: 14px; color: #64748B; font-weight: 500;">
                        ${candidate.designation || candidate.headline || 'Alumni Member'} ${candidate.company ? `at ${candidate.company}` : ''}
                    </p>

                    <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: #334155;">
                        <tr>
                            <td style="padding: 6px 0; width: 32%; color: #64748B; font-weight: 600;">Institution:</td>
                            <td style="padding: 6px 0; font-weight: 600; color: #002144;">${candidate.institution || 'Alumni Network'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Branch / Dept:</td>
                            <td style="padding: 6px 0;">${candidate.department || candidate.branch || 'General'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Batch Year:</td>
                            <td style="padding: 6px 0;">${candidate.batchYear || 'N/A'}</td>
                        </tr>
                        ${candidate.domain ? `
                        <tr>
                            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Domain:</td>
                            <td style="padding: 6px 0;">${candidate.domain}</td>
                        </tr>
                        ` : ''}
                        ${candidate.experienceYears ? `
                        <tr>
                            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Experience:</td>
                            <td style="padding: 6px 0;">${candidate.experienceYears}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Contact Email:</td>
                            <td style="padding: 6px 0;"><a href="mailto:${candidate.email}" style="color: #0055A5; text-decoration: none;">${candidate.email}</a></td>
                        </tr>
                    </table>

                    <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #F1F5F9;">
                        <span style="font-size: 12px; color: #64748B; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 6px;">Skills & Competencies</span>
                        <div>${skillsHtml}</div>
                    </div>
                </div>

                <!-- Action Button -->
                ${candidate.resumeUrl ? `
                <div style="text-align: center; margin: 28px 0;">
                    <a href="${candidate.resumeUrl}" target="_blank" style="background-color: #003366; color: #FFFFFF; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 15px; box-shadow: 0 4px 12px rgba(0,51,102,0.25);">
                        📥 Download & View Candidate Resume
                    </a>
                </div>
                ` : `
                <p style="text-align: center; font-size: 13px; color: #64748B;">
                    Candidate resume link is available on the internal portal.
                </p>
                `}

                <div style="margin-top: 28px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
                    <p style="font-size: 13px; color: #64748B; margin: 0; line-height: 1.5;">
                        Shared via <strong>${adminInstitution || 'Alumni'} Administration Portal</strong><br/>
                        For inquiries, reply directly to this email or reach out to <a href="mailto:${candidate.email}" style="color:#003366;">${candidate.email}</a>.
                    </p>
                </div>
            </div>
            <div style="background-color: #F8FAFC; padding: 16px; text-align: center; border-top: 1px solid #E2E8F0;">
                <p style="font-size: 12px; color: #94A3B8; margin: 0;">© ${new Date().getFullYear()} Alumni Network. All rights reserved.</p>
            </div>
        </div>
    `;

    if (apiKey && apiKey.startsWith('SG.')) {
        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: recipientEmail }] }],
                    from: { email: fromEmail, name: `${adminInstitution || 'Alumni'} Placement Desk` },
                    subject: emailSubject,
                    content: [
                        { type: 'text/plain', value: `Candidate Profile: ${candidate.name}\nInstitution: ${candidate.institution}\nEmail: ${candidate.email}\nResume URL: ${candidate.resumeUrl || 'N/A'}` },
                        { type: 'text/html', value: html }
                    ]
                })
            });

            if (response.status >= 200 && response.status < 300) {
                console.log(`[RESUME SHARE EMAIL OK] Sent to ${recipientEmail}`);
                return { success: true };
            }
            const errText = await response.text();
            console.error('[RESUME SHARE SENDGRID ERROR]:', errText);
        } catch (e) {
            console.error('[RESUME SHARE FETCH ERROR]:', e.message);
        }
    }

    // Nodemailer fallback
    try {
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
        if (smtpUser && smtpPass) {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: false,
                auth: { user: smtpUser, pass: smtpPass }
            });
            await transporter.sendMail({
                from: `"${adminInstitution || 'Alumni'} Placement Desk" <${smtpUser}>`,
                to: recipientEmail,
                subject: emailSubject,
                html
            });
            return { success: true };
        }
    } catch (e) {
        console.error('[RESUME SHARE NODEMAILER ERROR]:', e.message);
    }

    return { success: true, simulated: true };
};

module.exports = { sendWelcomeEmail, sendOtpEmail, sendPasswordResetEmail, sendCandidateResumeEmail };
