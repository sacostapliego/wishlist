import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { RefreshProvider } from './context/RefreshContext';
import { useEffect } from 'react';
import DeviceFrame from './context/FrameContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content =
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RefreshProvider>
          <Toast />
          <SafeAreaProvider>
            <DeviceFrame>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen
                  name="home"
                  options={{ headerShown: false, gestureEnabled: false }}
                />
                <Stack.Screen
                  name="auth"
                  options={{ headerShown: false, gestureEnabled: false }}
                />
              </Stack>
            </DeviceFrame>
          </SafeAreaProvider>
        </RefreshProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}