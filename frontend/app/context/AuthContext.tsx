import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import authAPI from '../services/auth';
import wishlistAPI from '../services/wishlist';
import userAPI from '../services/user';

// Define types for context value
type User = {
  id: string;
  email: string;
  username: string;
  name?: string;
  pfp?:string
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

// Storage keys
const USER_STORAGE_KEY = 'user_data';
const TOKEN_STORAGE_KEY = 'auth_token';

// Create context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for AuthProvider
type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in
    const loadUser = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
        
        if (!token) {
          console.log('No token found, user is logged out');
          setUser(null);
          setLoading(false);
          return;
        }

        if (userData) {
          setUser(JSON.parse(userData));
        }
        
        // Verify token with server
        try {
          const freshUserData = await userAPI.getProfile();
          setUser(freshUserData);
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUserData));
        } catch (error: any) {
          console.error('Failed server verification:', error?.response?.status, error?.response?.data);          
        }
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response && response.user && response.access_token) {
        // Store both the token and user data
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        
        setUser(response.user);
        return response;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      throw error;
    }
  };
  
  const register = async (userData: FormData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response && response.user && response.access_token) {
        // Store both the token and user data
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        
        setUser(response.user);
        return response;
      } else {
        throw new Error('Invalid registration response');
      }
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      // Call logout API if needed
      await authAPI.logout();
    } catch (error) {
      console.error('API logout failed', error);
    } finally {
      // Always clear local storage and user state
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await userAPI.getProfile();
      setUser(userData);
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        register, 
        isLoggedIn: !!user,
        loading,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Re-export the services
export { api, authAPI, wishlistAPI, userAPI };