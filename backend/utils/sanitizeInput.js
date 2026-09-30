/**
 * Enterprise Input Sanitizer
 * Protects against Cross-Site Scripting (XSS), script injection,
 * malicious event handlers, and unauthorized embedded frames.
 */

const sanitizeText = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip <script> blocks
        .replace(/javascript\s*:/gi, '') // Strip javascript: URLs
        .replace(/vbscript\s*:/gi, '') // Strip vbscript: URLs
        .replace(/data\s*:\s*text\/html/gi, '') // Strip data:text/html payloads
        .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '') // Strip inline event handlers (onload, onerror, onclick)
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Strip <iframe> tags
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Strip <object> tags
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Strip <embed> tags
        .trim();
};

const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
            obj[key] = sanitizeText(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            sanitizeObject(obj[key]);
        } else if (Array.isArray(obj[key])) {
            obj[key] = obj[key].map(item => (typeof item === 'string' ? sanitizeText(item) : item));
        }
    }
    return obj;
};

module.exports = { sanitizeText, sanitizeObject };
