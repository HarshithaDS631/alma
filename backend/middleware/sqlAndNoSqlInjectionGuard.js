/**
 * Enterprise SQL & NoSQL Injection Defense & Prototype Pollution Shield
 * 
 * Protects against:
 * 1. SQL Injection vectors (UNION SELECT, OR 1=1, DROP TABLE, stacked queries, blind SQLi)
 * 2. NoSQL Operator Injections ($gt, $ne, $where, $regex, $expr, $or)
 * 3. Prototype Pollution attacks (__proto__, constructor, prototype) that modify code/objects in memory
 * 4. Directory/Path Traversal attacks (../, ..\, %2e%2e)
 */

// SQL Injection attack signatures
const SQL_INJECTION_PATTERNS = [
    /\b(UNION(\s+ALL)?\s+SELECT)\b/i,
    /\b(SELECT\s+[\s\S]{1,60}?\s+FROM\s+[\s\S]{1,60}?\b)/i,
    /\b(INSERT\s+INTO\s+[\s\S]{1,40}?\s+VALUES)\b/i,
    /\b(UPDATE\s+[\s\S]{1,40}?\s+SET\s+[\s\S]{1,40}?\s*=)\b/i,
    /\b(DELETE\s+FROM\s+[\s\S]{1,40}?)\b/i,
    /\b(DROP\s+(TABLE|DATABASE|VIEW|COLUMN))\b/i,
    /\b(ALTER\s+TABLE\s+[\s\S]{1,40}?\s+(DROP|ADD))\b/i,
    /\b(EXEC(\s+XP_)?|XP_CMDSHELL)\b/i,
    /\b(WAITFOR\s+DELAY\s+['"]?\d+)/i,
    /\b(BENCHMARK\s*\(\s*\d+\s*,|SLEEP\s*\(\s*\d+\s*\))/i,
    /(\bOR\b|\bAND\b)\s+['"]?([0-9a-zA-Z]+)['"]?\s*=\s*['"]?\2['"]?/i, // e.g. '1'='1', 'a'='a', 1=1
    /(--\s*$|--\s*[\r\n]|;\s*DROP\s|;\s*DELETE\s|;\s*SHUTDOWN\s)/i
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERN = /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f)/i;

/**
 * Check if a single string matches any SQL injection or path traversal pattern
 */
function inspectStringValue(str) {
    if (typeof str !== 'string' || str.length < 3) return null;

    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(str)) {
            return `SQL Injection pattern matched: ${pattern.toString()}`;
        }
    }

    if (PATH_TRAVERSAL_PATTERN.test(str)) {
        return 'Path traversal sequence detected (../)';
    }

    return null;
}

/**
 * Recursively inspect and sanitize an object against NoSQL injection, SQL injection, and prototype pollution
 */
function inspectAndSanitize(obj, path = '', depth = 0) {
    if (depth > 12) return { violation: 'Excessive object nesting depth detected' };
    if (!obj || typeof obj !== 'object') return null;

    // Check for array
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            const item = obj[i];
            if (typeof item === 'string') {
                const violation = inspectStringValue(item);
                if (violation) return { violation, path: `${path}[${i}]` };
            } else if (typeof item === 'object' && item !== null) {
                const result = inspectAndSanitize(item, `${path}[${i}]`, depth + 1);
                if (result) return result;
            }
        }
        return null;
    }

    // Inspect object keys and values
    const keys = Object.keys(obj);
    for (const key of keys) {
        const fullPath = path ? `${path}.${key}` : key;

        // 1. Prototype Pollution Defense: strictly forbid modifying Object prototypes
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            delete obj[key];
            return {
                violation: `Prototype pollution attempt blocked (key: "${key}")`,
                path: fullPath
            };
        }

        // 2. NoSQL Operator Injection Defense: forbid root/nested MongoDB query operators
        if (key.startsWith('$')) {
            delete obj[key];
            return {
                violation: `NoSQL operator injection blocked (key: "${key}")`,
                path: fullPath
            };
        }

        // 3. Inspect string values for SQL injection
        const val = obj[key];
        if (typeof val === 'string') {
            const violation = inspectStringValue(val);
            if (violation) {
                return { violation, path: fullPath };
            }
        } else if (typeof val === 'object' && val !== null) {
            const result = inspectAndSanitize(val, fullPath, depth + 1);
            if (result) return result;
        }
    }

    return null;
}

/**
 * Express Middleware: guards all incoming requests against SQL/NoSQL injections & prototype pollution
 */
function sqlAndNoSqlInjectionGuard(req, res, next) {
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';

    // 1. Inspect URL parameters
    if (req.params && typeof req.params === 'object') {
        const violation = inspectAndSanitize(req.params, 'params');
        if (violation) {
            console.warn(`[SECURITY FIREWALL BLOCKED] URL Parameter attack from IP ${clientIp}: ${violation.violation} at ${violation.path}`);
            return res.status(400).json({
                error: 'Security Violation',
                message: 'Illegal parameter characters or injection attack pattern detected.'
            });
        }
    }

    // 2. Inspect Query String
    if (req.query && typeof req.query === 'object') {
        const violation = inspectAndSanitize(req.query, 'query');
        if (violation) {
            console.warn(`[SECURITY FIREWALL BLOCKED] Query String attack from IP ${clientIp}: ${violation.violation} at ${violation.path}`);
            return res.status(400).json({
                error: 'Security Violation',
                message: 'Illegal query syntax or injection attack pattern detected.'
            });
        }
    }

    // 3. Inspect Request Body
    if (req.body && typeof req.body === 'object') {
        const violation = inspectAndSanitize(req.body, 'body');
        if (violation) {
            console.warn(`[SECURITY FIREWALL BLOCKED] Request Body attack from IP ${clientIp}: ${violation.violation} at ${violation.path}`);
            return res.status(400).json({
                error: 'Security Violation',
                message: 'Malicious injection payload or prohibited object syntax detected in request body.'
            });
        }
    }

    next();
}

module.exports = sqlAndNoSqlInjectionGuard;
