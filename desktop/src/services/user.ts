import storage from '../utils/storage';
import api from './api';
import type { User, UpdateUserData } from '../types/types'

export interface PublicUserDetailsResponse {
  id: string;
  name?: string;
  username: string;
  pfp?: string;
  hat_size?: string | null;
  shirt_size?: string | null;
  pants_size?: string | null;
  shoe_size?: string | null;
  ring_size?: string | null;
  dress_size?: string | null;
  jacket_size?: string | null;
}

export const userAPI = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  updateProfile: async (userId: string, userData: UpdateUserData): Promise<User> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  updateUserProfile: async (userId: string, userData: UpdateUserData): Promise<User> => {
    const formData = new FormData();
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value as string | Blob);
      }
    });
    const response = await api.put(`/users/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  updateProfileImage: async (userId: string, imageFile: File): Promise<User> => {
    const formData = new FormData();
    formData.append('profile_picture', imageFile);
    const response = await api.put(`/users/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  removeProfileImage: async (userId: string): Promise<User> => {
    const formData = new FormData();
    formData.append('remove_profile_picture', 'true');
    const response = await api.put(`/users/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getPublicUserDetails: async (userId: string): Promise<PublicUserDetailsResponse> => {
    const response = await api.get(`/users/public/${userId}`);
    return response.data;
  },

  getCurrentUserId: async (): Promise<string> => {
    const token = await storage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Decode JWT to get user ID (JWT format: header.payload.signature)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.user_id || payload.id;
  },
};

export default userAPI;