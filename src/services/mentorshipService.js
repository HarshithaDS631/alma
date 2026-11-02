import api from './api';

export const fetchMentors = async () => {
    try {
        const { data } = await api.get('/mentorship/mentors');
        return data;
    } catch (e) {
        console.log('fetchMentors error:', e);
        return [];
    }
};

export const fetchAvailableSlots = async (mentorId) => {
    try {
        const { data } = await api.get(`/mentorship/slots/${mentorId}`);
        return data?.slots || [];
    } catch (e) {
        console.log('fetchAvailableSlots error:', e);
        return [];
    }
};

export const bookMentorshipSlot = async (payload) => {
    const { data } = await api.post('/mentorship/slots/book', payload);
    return data;
};

export const fetchMyBookedSessions = async () => {
    try {
        const { data } = await api.get('/mentorship/sessions/my');
        return data;
    } catch (e) {
        console.log('fetchMyBookedSessions error:', e);
        return [];
    }
};

export const setAvailabilitySlots = async (slots) => {
    const { data } = await api.post('/mentorship/slots', { slots });
    return data;
};
