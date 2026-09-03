import api from './api';

export const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
};

export const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
};

export const checkEmailExists = async (email) => {
    const { data } = await api.post('/auth/check-email', { email });
    return data.exists; // returns boolean
};

export const sendOtp = async (email) => {
    const { data } = await api.post('/auth/send-otp', { email });
    return data;
};

export const verifyOtp = async (email, otp) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    return data;
};

export const sendLoginOtp = async (identifier, channel = 'email') => {
    const { data } = await api.post('/auth/send-login-otp', { identifier, channel });
    return data;
};

export const loginWithOtp = async (identifier, otp) => {
    const { data } = await api.post('/auth/login-otp', { identifier, otp });
    return data;
};

export const getProfile = async () => {
    const { data } = await api.get('/auth/profile');
    return data;
};

export const updateProfile = async (profileData) => {
    const { data } = await api.put('/auth/profile', profileData);
    return data;
};

export const changePassword = async (passwordData) => {
    const { data } = await api.put('/auth/change-password', passwordData);
    return data;
};

export const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
};

export const resetPassword = async (token, newPassword) => {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    return data;
};

export const deleteAccount = async () => {
    const { data } = await api.delete('/auth/account');
    return data;
};

// Also adding block routes here or separate, but small enough for authService
export const blockUser = async (blockedId) => {
    const { data } = await api.post('/blocks', { blockedId });
    return data;
};

export const unblockUser = async (blockedId) => {
    const { data } = await api.delete(`/blocks/${blockedId}`);
    return data;
};

export const getSuggestions = async () => {
    const { data } = await api.get('/auth/suggestions');
    return data;
};

export const getUsers = async (params = {}) => {
    const { data } = await api.get('/auth/users', { params });
    return data;
};

export const toggleFollowUser = async (userId) => {
    const { data } = await api.post(`/auth/follow/${userId}`);
    return data;
};

export const getFollowers = async () => {
    const { data } = await api.get('/auth/followers');
    return data;
};

export const getFollowing = async () => {
    const { data } = await api.get('/auth/following');
    return data;
};

export const getNotifications = async () => {
    const { data } = await api.get('/auth/notifications');
    return data;
};

export const markNotificationsRead = async (id = 'all') => {
    const { data } = await api.put(`/auth/notifications/${id}/read`);
    return data;
};

export const getPosts = async () => {
    const { data } = await api.get('/posts');
    return data;
};

export const toggleLikePost = async (postId) => {
    const { data } = await api.put(`/posts/${postId}/like`);
    return data;
};

export const getEvents = async () => {
    const { data } = await api.get('/events');
    return data;
};

export const logout = async () => {
    const { data } = await api.post('/auth/logout');
    return data;
};

export const getLoginHistory = async () => {
    const { data } = await api.get('/auth/login-history');
    return data;
};

// ─── Phase 2: Enhanced Auth Services ──────────────────────────────

export const googleAuth = async ({ idToken, accessToken }) => {
    const { data } = await api.post('/auth/google', { idToken, accessToken });
    return data;
};

export const refreshToken = async (refreshTokenValue) => {
    const { data } = await api.post('/auth/refresh-token', { refreshToken: refreshTokenValue });
    return data;
};

export const setup2FA = async () => {
    const { data } = await api.post('/auth/2fa/setup');
    return data;
};

export const verify2FA = async (code) => {
    const { data } = await api.post('/auth/2fa/verify', { code });
    return data;
};

export const loginVerify2FA = async (twoFactorToken, code) => {
    const { data } = await api.post('/auth/2fa/login-verify', { twoFactorToken, code });
    return data;
};

export const disable2FA = async ({ password, code }) => {
    const { data } = await api.post('/auth/2fa/disable', { password, code });
    return data;
};

export const getActiveSessions = async () => {
    const { data } = await api.get('/auth/sessions');
    return data;
};

export const revokeSession = async (sessionId) => {
    const { data } = await api.delete(`/auth/sessions/${sessionId}`);
    return data;
};

export const sendConnectionRequest = async (recipientId) => {
    const { data } = await api.post(`/auth/connect/${recipientId}`);
    return data;
};

export const getConnectionRequests = async () => {
    const { data } = await api.get('/auth/connection-requests');
    return data;
};

export const acceptConnectionRequest = async (requestId) => {
    const { data } = await api.post(`/auth/connection-requests/${requestId}/accept`);
    return data;
};

export const declineConnectionRequest = async (requestId) => {
    const { data } = await api.post(`/auth/connection-requests/${requestId}/decline`);
    return data;
};

