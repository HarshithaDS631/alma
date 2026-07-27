import axios from 'axios';
import api, { API_URL } from './api';
import { Platform } from 'react-native';

/**
 * Resolves full qualified URL for image paths.
 * @param {string} url - Relative or absolute image URL
 * @returns {string|null} Full image URL
 */
export const getImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  if (cleanUrl === '' || cleanUrl === 'undefined' || cleanUrl === 'null' || cleanUrl.includes('/undefined') || cleanUrl.includes('/null')) return null;
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }
  // Server origin (e.g., https://backend-pi-bice-97.vercel.app)
  const serverOrigin = API_URL.replace(/\/api\/?$/, '');
  if (cleanUrl.startsWith('/')) {
    return `${serverOrigin}${cleanUrl}`;
  }
  return `${serverOrigin}/${cleanUrl}`;
};

/**
 * Uploads a file (like an image) to the backend.
 * @param {string} uri - The local file URI from expo-image-picker
 * @param {string} mimeType - The mime type of the file (e.g., 'image/jpeg')
 * @param {string} name - The file name
 * @returns {Promise<string>} The uploaded file URL
 */

const compressImageWeb = async (uri, mimeType) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Canvas toBlob failed'));
            }, mimeType || 'image/jpeg', 0.6); // 60% quality
        };
        img.onerror = (e) => reject(e);
        img.src = uri;
    });
};

export const uploadFile = async (uri, mimeType = 'image/jpeg', name = 'upload.jpg') => {
    try {
        const formData = new FormData();
        
        if (Platform.OS === 'web') {
            try {
                const blob = await compressImageWeb(uri, mimeType);
                formData.append('image', blob, name);
            } catch (err) {
                console.warn('Compression failed on web, falling back to original blob', err);
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('image', blob, name);
            }
        } else {
            formData.append('image', {
                uri,
                name,
                type: mimeType
            });
        }

        // Use custom multipart/form-data headers
        const response = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Accept: 'application/json',
            },
        });

        if (response.data && response.data.url) {
            return getImageUrl(response.data.url);
        }
        throw new Error('Upload failed, no URL returned');
    } catch (error) {
        console.error('File upload error:', error);
        throw error;
    }
};
