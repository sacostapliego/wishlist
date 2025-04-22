import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  updateProfile: async (userId: string, userData: any) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  updateUserProfile: async (userData: any) => {
    const formData = new FormData();
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });
    const response = await api.put(`/users/${userData.id || ''}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  },
  
  updateProfileImage: async (imageFile: any) => {
    const formData = new FormData();
    formData.append('profile_picture', imageFile);

    const userId = await userAPI.getCurrentUserId();
    
    const response = await api.put(`/users/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    return response.data;
  },

  getCurrentUserId: async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const parsedData = JSON.parse(userData);
        return parsedData.id || '';
      }
      return '';
    } catch (e) {
      console.error('Error getting user ID:', e);
      return '';
    }
  },

  removeProfileImage: async (userId: string) => {
    try {
      const formData = new FormData();
      formData.append('remove_profile_picture', 'true');
      
      const response = await api.put(`/users/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing profile picture:', error);
      throw error;
    }
  },
};

export default userAPI;