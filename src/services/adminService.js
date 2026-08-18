import api from './api';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getDashboardStats = async (institution) => {
    const url = institution && institution !== 'All' 
        ? `/admin/stats?institution=${encodeURIComponent(institution)}` 
        : '/admin/stats';
    const { data } = await api.get(url);
    return data;
};

export const approveUser = async (userId) => {
  const { data } = await api.put(`/admin/users/${userId}/approve`);
  return data;
};

export const getPendingUsers = async (institution = undefined) => {
  const url = institution && institution !== 'All' 
      ? `/admin/pending-users?institution=${encodeURIComponent(institution)}` 
      : '/admin/pending-users';
  const { data } = await api.get(url);
  return data;
};

export const rejectUser = async (userId) => {
  const { data } = await api.delete(`/admin/users/${userId}/reject`);
  return data;
};

export const updateUserRole = async (userId, role) => {
    const { data } = await api.put(`/admin/users/${userId}/role`, { role });
    return data;
};

// Admin report operations
export const getReports = async () => {
    const { data } = await api.get('/reports');
    return data;
};

export const updateReportStatus = async (reportId, status) => {
    const { data } = await api.put(`/reports/${reportId}/status`, { status });
    return data;
};

export const getAllUsers = async () => {
    // This uses the auth endpoint that returns all users
    const { data } = await api.get('/auth/users');
    return data;
};

export const getEmailStats = async (params = {}) => {
    const { institution, startDate, endDate, type } = params;
    const query = new URLSearchParams();
    if (institution && institution !== 'All') query.append('institution', institution);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (type) query.append('type', type);

    const qs = query.toString();
    const { data } = await api.get(`/admin/email-stats${qs ? `?${qs}` : ''}`);
    return data;
};

export const checkMatch = async (userId) => {
    const { data } = await api.get(`/admin/users/${userId}/check-match`);
    return data;
};

export const getActivityLogs = async (limit = 100, search = '') => {
    const { data } = await api.get(`/activity?limit=${limit}&search=${encodeURIComponent(search)}`);
    return data;
};
