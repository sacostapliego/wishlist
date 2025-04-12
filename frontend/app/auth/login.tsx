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
import { COLORS, SPACING } from '../styles/theme';

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

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.inactive}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.inactive}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
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
    backgroundColor: COLORS.background,
  },
  formContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xl,
  },
  input: {
    height: 56,
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  button: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  registerTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});