import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Toast from 'react-native-toast-message';
import { RefreshProvider } from './context/RefreshContext';
import { useEffect } from 'react';
import DeviceFrame from './context/FrameContext';



export default function RootLayout() {

  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Check if we're in a web environment
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <AuthProvider>
      <RefreshProvider>
        <Toast/>
        <SafeAreaProvider>
          <DeviceFrame>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen 
                name="/home" 
                options={{ headerShown: false, gestureEnabled: false }} 
              />
              <Stack.Screen 
                name="auth" 
                options={{ headerShown: false, gestureEnabled: false }} 
              />
              <Stack.Screen 
                name="shared" 
                options={{ headerShown: false, gestureEnabled: false }} 
              />
            </Stack>
          </DeviceFrame>
        </SafeAreaProvider>
      </RefreshProvider>
    </AuthProvider>
  );
}