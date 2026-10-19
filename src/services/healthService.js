import axios from 'axios';
import { API_URL } from './api';

// Derived health check URL (e.g., http://localhost:5000/health or https://.../api/health)
const getHealthUrl = () => {
    try {
        if (API_URL.endsWith('/api')) {
            return `${API_URL}/health`;
        }
        return `${API_URL}/health`;
    } catch {
        return 'https://alma-orpin-delta.vercel.app/api/health';
    }
};

/**
 * Check backend server health and database connectivity
 * Fast 4-second timeout to give instant feedback without freezing the UI
 */
export const checkServerHealth = async () => {
    const healthUrl = getHealthUrl();
    const startTime = Date.now();

    try {
        const response = await axios.get(healthUrl, {
            timeout: 4000,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        const data = response.data || {};
        return {
            active: true,
            status: data.status || 'healthy',
            database: data.database || { status: 'connected', healthy: true },
            cluster: data.cluster || {},
            securityShield: data.securityShield || {},
            latencyMs: Date.now() - startTime
        };
    } catch (err) {
        // Fallback: try pinging root or API endpoint
        try {
            const fallbackUrl = API_URL.replace(/\/api\/?$/, '') + '/ping';
            await axios.get(fallbackUrl, { timeout: 2500 });
            return {
                active: true,
                status: 'degraded',
                database: { status: 'reconnecting', healthy: false },
                latencyMs: Date.now() - startTime
            };
        } catch {
            return {
                active: false,
                status: 'unreachable',
                error: err.message || 'Server connection timed out',
                latencyMs: Date.now() - startTime
            };
        }
    }
};

/**
 * Simple boolean ping to verify server connectivity
 */
export const pingServer = async () => {
    const result = await checkServerHealth();
    return result.active;
};

export default {
    checkServerHealth,
    pingServer
};
