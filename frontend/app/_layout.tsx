import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Toast from 'react-native-toast-message';



export default function RootLayout() {
  return (
    <AuthProvider>
      <Toast/>
      <SafeAreaProvider>
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
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
}