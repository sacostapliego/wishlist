import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { AUTH_COLORS, COLORS, SPACING } from '../styles/theme';
import GradientBorderInput from '../components/forms/GradientBorderInput';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      const response = await login(email, password);
      if (response && response.user) {
        router.replace('/home');
      }
    } catch (error: any) {
      let errorMessage = 'Unable to login. Please check your credentials.';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (typeof error?.message === 'string') {
        errorMessage = error.message;
      }
      
      console.error('Login error:', errorMessage);
      
      Alert.alert(
        'Login Failed',
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <GradientBorderInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          colors={[AUTH_COLORS.primary, AUTH_COLORS.secondary]}
          placeholderTextColor={AUTH_COLORS.inactive}
        />

        <GradientBorderInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          colors={[AUTH_COLORS.secondary, AUTH_COLORS.primary]}
          placeholderTextColor={AUTH_COLORS.inactive}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/auth/register')}
        >
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
  },
  formContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AUTH_COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: AUTH_COLORS.text.secondary,
    marginBottom: SPACING.xl,
  },
  input: {
    height: 56,
    backgroundColor: AUTH_COLORS.cardDark,
    borderRadius: 8,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: AUTH_COLORS.text.primary,
  },
  button: {
    backgroundColor: AUTH_COLORS.primary,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  registerText: {
    color: AUTH_COLORS.text.secondary,
    fontSize: 14,
  },
  registerTextBold: {
    color: AUTH_COLORS.primary,
    fontWeight: '600',
  },
});