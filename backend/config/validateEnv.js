/**
 * Environment Variable Pre-Flight Validator
 * Verifies that all mission-critical secrets and connection strings
 * are properly configured prior to starting the HTTP / WebSocket server.
 */

const validateEnv = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const errors = [];
    const warnings = [];

    // Critical Environment Variables
    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
        errors.push('MONGO_URI / MONGODB_URI is required to establish database connection.');
    }

    if (isProduction) {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
            errors.push('JWT_SECRET is missing or insufficiently long (minimum 16 characters required in production).');
        }
        if (process.env.JWT_SECRET === 'super_secret_jwt_key_rvce_alumni_2026_xyz' || process.env.JWT_SECRET === 'secret') {
            errors.push('JWT_SECRET cannot use default or predictable sample strings.');
        }
    }

    // Optional / Service Warnings
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        warnings.push('SMTP configuration incomplete (SMTP_HOST, SMTP_USER, SMTP_PASS). Outbound emails may fail.');
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        warnings.push('Cloudinary credentials not set. File uploads will default to MongoDB GridFS storage.');
    }

    // Print diagnostic results
    if (warnings.length > 0) {
        warnings.forEach(w => console.warn(`[ENV WARNING] ${w}`));
    }

    if (errors.length > 0) {
        console.error('=================================================================');
        console.error(' [FATAL CONFIGURATION ERROR] Environment validation failed:');
        errors.forEach(e => console.error(`  ❌ ${e}`));
        console.error('=================================================================');
        if (isProduction && !process.env.VERCEL) {
            process.exit(1);
        }
    } else {
        console.log('[ENV CONFIG] Pre-flight environment validation: PASSED ✓');
    }
};

module.exports = validateEnv;

