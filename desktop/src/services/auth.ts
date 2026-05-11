import api from './api';
import storage from '../utils/storage';
import type { User } from '../types/types';

interface LoginCredentials {
  email: string
  password: string
}

interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export const authAPI = {
  register: async (userData: FormData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await storage.setItem('auth_token', response.data.access_token);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    await storage.setItem('auth_token', response.data.access_token);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await storage.removeItem('auth_token');
  },
};

export default authAPI;