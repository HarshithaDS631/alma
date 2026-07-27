import api from './api';

export const getPosts = async () => {
    const { data } = await api.get('/posts');
    return data;
};

export const getUserPosts = async () => {
    const { data } = await api.get('/posts/user/profile');
    return data;
};

export const createPost = async (postData) => {
    const { data } = await api.post('/posts', postData);
    return data;
};

export const likePost = async (postId) => {
    const { data } = await api.put(`/posts/${postId}/like`);
    return data;
};

export const addComment = async (postId, text) => {
    const { data } = await api.post(`/posts/${postId}/comment`, { text });
    return data;
};

export const deletePost = async (postId) => {
    const { data } = await api.delete(`/posts/${postId}`);
    return data;
};

// Also adding report creation here since it's used in the EngageScreen
export const reportItem = async (reportData) => {
    const { data } = await api.post('/reports', reportData);
    return data;
};

export const toggleSavePost = async (postId) => {
    const { data } = await api.put(`/posts/${postId}/save`);
    return data;
};

export const getSavedPosts = async () => {
    const { data } = await api.get('/posts/saved');
    return data;
};

export const resharePost = async (postId, note = '') => {
    const { data } = await api.post(`/posts/${postId}/reshare`, { note });
    return data;
};

export const updatePostSettings = async (postId, settings) => {
    const { data } = await api.put(`/posts/${postId}/settings`, settings);
    return data;
};

export const editPost = async (postId, content) => {
    const { data } = await api.put(`/posts/${postId}/edit`, { content });
    return data;
};
