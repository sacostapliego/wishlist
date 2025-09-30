import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from './context/AuthContext';
import { COLORS } from './styles/theme';

export default function Index() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        if (isLoggedIn) {
          router.replace('/home');
        } else {
          router.replace('/auth/login');
        }
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [isLoggedIn, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}