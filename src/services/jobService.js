import api from './api';

export const fetchJobs = async (filters = {}) => {
    try {
        const { data } = await api.get('/jobs', { params: filters });
        return data;
    } catch (e) {
        console.log('fetchJobs error:', e);
        return [];
    }
};

export const createJobPosting = async (jobData) => {
    const { data } = await api.post('/jobs', jobData);
    return data;
};

export const toggleSaveJob = async (jobId) => {
    const { data } = await api.post(`/jobs/${jobId}/save`);
    return data;
};

export const applyToJob = async (jobId, payload = {}) => {
    const { data } = await api.post(`/jobs/${jobId}/apply`, payload);
    return data;
};

export const fetchJobTracker = async () => {
    try {
        const { data } = await api.get('/jobs/tracker');
        return data;
    } catch (e) {
        console.log('fetchJobTracker error:', e);
        return { savedJobs: [], appliedJobs: [] };
    }
};

export const fetchJobPreferences = async () => {
    try {
        const { data } = await api.get('/jobs/preferences');
        return data;
    } catch (e) {
        console.log('fetchJobPreferences error:', e);
        return null;
    }
};

export const updateJobPreferences = async (preferences) => {
    const { data } = await api.put('/jobs/preferences', preferences);
    return data;
};

export const fetchRecommendedJobs = async () => {
    try {
        const { data } = await api.get('/jobs/recommended');
        return data;
    } catch (e) {
        console.log('fetchRecommendedJobs error:', e);
        return [];
    }
};

export const fetchResumeBook = async (filters = {}) => {
    try {
        const { data } = await api.get('/jobs/resume-book', { params: filters });
        return data;
    } catch (e) {
        console.log('fetchResumeBook error:', e);
        return [];
    }
};

export const shareCandidateResume = async (payload) => {
    const { data } = await api.post('/jobs/resume-book/share', payload);
    return data;
};

