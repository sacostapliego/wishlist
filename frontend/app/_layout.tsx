import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false, gestureEnabled: false }} 
          />
          <Stack.Screen 
            name="auth" 
            options={{ headerShown: false, gestureEnabled: false }} 
          />
          <Stack.Screen 
            name="create-wishlist" 
            options={{ presentation: 'modal', gestureEnabled: true }} 
          />
          <Stack.Screen 
            name="add-item" 
            options={{ presentation: 'modal', gestureEnabled: true }} 
          />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
}