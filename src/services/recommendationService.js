import api from './api';

/**
 * Fetch AI Recommended Alumni Matches
 */
export const getRecommendedAlumni = async () => {
    try {
        const response = await api.get('/recommendations/alumni');
        return response.data?.recommendations || [];
    } catch (error) {
        console.error('[RECOMMEND ALUMNI API ERROR]:', error.message);
        return [];
    }
};

/**
 * Fetch Recommended Jobs & Internships
 */
export const getRecommendedJobs = async () => {
    try {
        const response = await api.get('/recommendations/jobs');
        return response.data?.jobs || [];
    } catch (error) {
        console.error('[RECOMMEND JOBS API ERROR]:', error.message);
        return [];
    }
};

/**
 * Fetch Career Insights & Salary Benchmarks
 */
export const getCareerInsights = async () => {
    try {
        const response = await api.get('/recommendations/insights');
        return response.data?.insights || null;
    } catch (error) {
        console.error('[CAREER INSIGHTS API ERROR]:', error.message);
        return null;
    }
};

/**
 * Endorse a peer skill
 */
export const endorseSkill = async (targetUserId, skillName) => {
    try {
        const response = await api.post('/recommendations/endorse', { targetUserId, skillName });
        return response.data;
    } catch (error) {
        console.error('[ENDORSE SKILL API ERROR]:', error.message);
        throw error;
    }
};
