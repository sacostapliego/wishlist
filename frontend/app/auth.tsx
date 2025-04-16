import { useSegments, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';

export function useProtectedRoute(shouldBeAuthenticated = true) {
  const { isLoggedIn, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  useEffect(() => {
    if (loading) return;
    
    const inAuthGroup = segments[0] === 'auth';
    
    if (!isLoggedIn && shouldBeAuthenticated && !inAuthGroup) {
      setTimeout(() => {
        router.replace('/auth/register');
      }, 0);
    } else if (isLoggedIn && !shouldBeAuthenticated && inAuthGroup) {
      setTimeout(() => {
        router.replace('/home');
      }, 0);
    }
  }, [loading, isLoggedIn, segments, shouldBeAuthenticated]);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  useProtectedRoute(true);
  return <>{children}</>;
}