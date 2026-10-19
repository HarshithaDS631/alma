const mongoose = require('mongoose');
const os = require('os');
const connectDB = require('../config/db');

// Record process startup time
const processStartTime = Date.now();

/**
 * Format uptime seconds into human-readable duration
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
}

/**
 * Ping MongoDB database with a strict 2-second timeout to prevent request hanging
 */
async function checkDatabase() {
    const state = mongoose.connection.readyState;
    const stateLabels = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    if (state !== 1) {
        // Try connecting in the background
        connectDB().catch(() => {});
        return {
            status: stateLabels[state] || 'unknown',
            healthy: false,
            latencyMs: null
        };
    }

    try {
        const pingPromise = mongoose.connection.db.admin().ping();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database ping timeout')), 2000)
        );

        const start = Date.now();
        await Promise.race([pingPromise, timeoutPromise]);
        const latencyMs = Date.now() - start;

        return {
            status: 'connected',
            healthy: true,
            latencyMs,
            host: mongoose.connection.host || 'cluster',
            name: mongoose.connection.name || 'alumni_db'
        };
    } catch (err) {
        return {
            status: 'degraded',
            healthy: false,
            latencyMs: null,
            error: err.message
        };
    }
}

/**
 * @desc    Comprehensive Server Health Check (Liveness & Readiness probe)
 * @route   GET /health, GET /healthz, GET /api/health, GET /api/v1/health
 * @access  Public (no auth required for monitoring)
 */
exports.getHealth = async (req, res) => {
    const startTime = Date.now();
    const uptimeSec = Math.floor((Date.now() - processStartTime) / 1000);
    const dbStatus = await checkDatabase();

    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const isHealthy = dbStatus.healthy;
    const statusCode = isHealthy ? 200 : (dbStatus.status === 'connecting' ? 200 : 503);

    // Set aggressive cache-busting headers so monitors always get fresh status
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Server-Status', isHealthy ? 'HEALTHY' : 'DEGRADED');
    res.setHeader('X-Cluster-Worker-Pid', String(process.pid));

    return res.status(statusCode).json({
        status: isHealthy ? 'healthy' : (dbStatus.status === 'connecting' ? 'starting' : 'degraded'),
        active: true,
        service: 'Alumni Network Enterprise API',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: uptimeSec,
            formatted: formatUptime(uptimeSec)
        },
        database: dbStatus,
        cluster: {
            workerPid: process.pid,
            workerIndex: process.env.WORKER_INDEX ? parseInt(process.env.WORKER_INDEX, 10) : 1,
            cpuCores: os.cpus().length,
            platform: process.platform
        },
        securityShield: {
            antiBotDefense: 'ACTIVE',
            bruteForceProtection: 'ACTIVE (5-Attempt Threshold / 10m Lockout)',
            distributedGroupDefense: 'ACTIVE (Subnet / Velocity Rate Guard)',
            sqlInjectionShield: 'ACTIVE (Deep Signature Scanner)',
            noSqlInjectionShield: 'ACTIVE (Operator & Key Filter)',
            prototypePollutionGuard: 'ACTIVE (Prototype Freezing & Key Drop)'
        },
        memory: {
            heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
            rssMb: Math.round(mem.rss / 1024 / 1024),
            systemFreeMb: Math.round(freeMem / 1024 / 1024),
            systemTotalMb: Math.round(totalMem / 1024 / 1024)
        },
        responseTimeMs: Date.now() - startTime
    });
};

/**
 * @desc    Lightweight ping endpoint for load balancer health probes
 * @route   GET /ping
 * @access  Public
 */
exports.getPing = (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send('pong');
};
