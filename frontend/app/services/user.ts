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
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
  
  updateProfileImage: async (imageFile: any) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/users/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  removeProfileImage: async () => {
    const response = await api.delete('/users/profile-image');
    return response.data;
  }
};

export default userAPI;