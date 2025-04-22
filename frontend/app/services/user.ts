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
    
    const response = await api.put('/users/' + userAPI.getCurrentUserId(), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getCurrentUserId: () => {
    // Get the current user ID from localStorage or state management
    try {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      return userData.id || '';
    } catch (e) {
      console.error('Error getting user ID:', e);
      return '';
    }
  },

  removeProfileImage: async (userId: string) => {
    const formData = new FormData();
    formData.append('profile_picture', '');
    
    const response = await api.put(`/users/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  }
};

export default userAPI;