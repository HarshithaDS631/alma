/**
 * Anti-Bot and Security Defense Middleware
 * Protects server against automated vulnerability scanners, credential stuffers, and scraper bots.
 */

// Known malicious user-agent signatures and automated attack tools
const MALICIOUS_BOT_REGEX = /(sqlmap|nikto|masscan|dirbuster|nmap|zgrab|gobuster|wpscan|hydra|burpcollaborator|acunetix|nessus|openvas|shodan|censys)/i;

// Scrapers and automated headless clients on sensitive auth routes
const AUTOMATED_SCRAPER_REGEX = /(python-requests|aiohttp|urllib|curl\/|wget\/|go-http-client|apache-httpclient)/i;

/**
 * Middleware: inspects incoming requests and blocks malicious bots and scrapers
 */
function botProtectionMiddleware(req, res, next) {
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    // 1. Immediately drop known exploit / penetration testing bots
    if (MALICIOUS_BOT_REGEX.test(userAgent)) {
        console.warn(`[BOT BLOCKED] High-threat exploit scanner detected from IP ${ip}: ${userAgent}`);
        return res.status(403).json({
            message: 'Access Denied: Automated security scanning and unauthorized bot activity is prohibited.'
        });
    }

    // 2. Block headless / command-line scrapers targeting authentication endpoints without browser headers
    const isAuthRoute = req.path.includes('/auth') || req.path.includes('/login') || req.path.includes('/register');
    if (isAuthRoute && AUTOMATED_SCRAPER_REGEX.test(userAgent)) {
        // Allow in development or explicit testing
        if (process.env.NODE_ENV !== 'test' && !process.env.ALLOW_CLI_AUTH) {
            console.warn(`[BOT BLOCKED] Automated script client attempted auth access from IP ${ip}: ${userAgent}`);
            return res.status(403).json({
                message: 'Access Denied: Automated authentication requests are blocked. Please use an official application or web client.'
            });
        }
    }

    // 3. Honeypot check: inspect common honeypot trap fields in request body
    // Legitimate users will leave these invisible fields empty; bots blindly populate them
    if (req.body && typeof req.body === 'object') {
        const honeypotKeys = ['website_hp', 'honeypot_field', '_hp_check', 'company_fax_hp'];
        for (const key of honeypotKeys) {
            if (req.body[key] && String(req.body[key]).trim().length > 0) {
                console.warn(`[BOT HONEYPOT TRIGGERED] Bot filled hidden honeypot trap field "${key}" from IP ${ip}`);
                // Return generic error without explaining honeypot
                return res.status(400).json({
                    message: 'Invalid submission parameters detected.'
                });
            }
        }
    }

    next();
}

module.exports = botProtectionMiddleware;
