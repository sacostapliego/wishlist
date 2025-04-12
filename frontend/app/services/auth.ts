import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authAPI = {
  register: async (userData: FormData) => {
    const response = await api.post('/auth/register', userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    await AsyncStorage.setItem('auth_token', response.data.access_token);
    return response.data;
  },
  
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    await AsyncStorage.setItem('auth_token', response.data.access_token);
    return response.data;
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
  },
};

export default authAPI;