import axios from 'axios';
import storage from '../utils/storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/';
export { API_URL };

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Silent error handling in production
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;