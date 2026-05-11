import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';



const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/';
  } else {
    const debuggerHost = Constants.expoConfig?.hostUri || 
                         Constants.manifest2?.debuggerHost || 
                         Constants.expoGoConfig?.debuggerHost;
    
    if (debuggerHost) {
      const host = debuggerHost.split(':').shift();
      if (host) {
        return `http://${host}:8000/`;
      }
    }
    
    return process.env.EXPO_MACHINE_URL;
  }
};

const API_URL = getApiUrl();
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
      const token = await AsyncStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Silent error handling in production
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;