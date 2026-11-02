import api, { API_URL } from './api';
import { Platform } from 'react-native';

const CLOUD_BACKEND = 'https://alma-orpin-delta.vercel.app';

/**
 * Resolves full qualified URL for image paths.
 * Handles relative paths, localhost replacements, and null fallbacks.
 * @param {string} url - Relative or absolute image URL
 * @returns {string|null} Full image URL
 */
export const getImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  if (
    cleanUrl === '' ||
    cleanUrl === 'undefined' ||
    cleanUrl === 'null' ||
    cleanUrl.includes('/undefined') ||
    cleanUrl.includes('/null')
  ) {
    return null;
  }

  // Handle stale seed photo hashes
  if (cleanUrl.includes('6a0a8e156693c176e3d31931af9df3f5')) {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80';
  }

  // If URL references local dev ports, map to production cloud server so media loads reliably
  if (
    cleanUrl.includes('localhost:5000') ||
    cleanUrl.includes('127.0.0.1:5000') ||
    cleanUrl.includes('10.0.2.2:5000')
  ) {
    return cleanUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2):5000/, CLOUD_BACKEND);
  }

  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('data:') ||
    cleanUrl.startsWith('blob:')
  ) {
    return cleanUrl;
  }

  // Derive active origin
  let serverOrigin = (API_URL || CLOUD_BACKEND).replace(/\/api\/?$/, '');
  if (
    serverOrigin.includes('localhost') ||
    serverOrigin.includes('127.0.0.1') ||
    serverOrigin.includes('10.0.2.2')
  ) {
    serverOrigin = CLOUD_BACKEND;
  }

  if (cleanUrl.startsWith('/')) {
    return `${serverOrigin}${cleanUrl}`;
  }
  return `${serverOrigin}/${cleanUrl}`;
};

/**
 * Compresses an image on the web using an HTML5 Canvas.
 */
const compressImageWeb = async (uri, mimeType) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for external http(s) URLs, not local blob/data URLs
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      img.crossOrigin = 'Anonymous';
    }
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
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        mimeType || 'image/jpeg',
        0.75
      );
    };
    img.onerror = (e) => reject(e);
    img.src = uri;
  });
};

/**
 * Uploads a file (like an image or PDF) to the backend.
 * @param {string} uri - The local file URI from expo-image-picker or file picker
 * @param {string} mimeType - The mime type of the file (e.g., 'image/jpeg')
 * @param {string} name - The file name
 * @returns {Promise<string>} The uploaded file URL
 */
export const uploadFile = async (uri, mimeType = 'image/jpeg', name = 'upload.jpg') => {
  try {
    const formData = new FormData();
    const isDocument =
      mimeType.includes('pdf') ||
      mimeType.includes('word') ||
      mimeType.includes('officedocument') ||
      mimeType.startsWith('application/');

    if (Platform.OS === 'web') {
      if (isDocument) {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('image', blob, name);
      } else {
        try {
          const blob = await compressImageWeb(uri, mimeType);
          formData.append('image', blob, name);
        } catch (err) {
          console.warn('Canvas compression skipped, using raw blob:', err.message);
          const response = await fetch(uri);
          const blob = await response.blob();
          formData.append('image', blob, name);
        }
      }
    } else {
      formData.append('image', {
        uri,
        name,
        type: mimeType,
      });
    }

    const config = {
      headers: {
        Accept: 'application/json',
      },
    };
    if (Platform.OS !== 'web') {
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await api.post('/upload', formData, config);

    if (response.data && response.data.url) {
      return getImageUrl(response.data.url);
    }
    throw new Error('Upload failed: no URL returned in response');
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};
