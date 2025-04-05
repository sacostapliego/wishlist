import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../styles/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    // Form validation
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      const userData = {
        email,
        username,
        name: name || username, // Use username as name if name is not provided
        password
      };
      
      const response = await register(userData);
      if (response && response.user) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (typeof error?.message === 'string') {
        errorMessage = error.message;
      }
      
      console.error('Registration error:', errorMessage);
      
      Alert.alert(
        'Registration Failed',
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.inactive}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={COLORS.inactive}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            textContentType="username"
          />

          <TextInput
            style={styles.input}
            placeholder="Full Name (Optional)"
            placeholderTextColor={COLORS.inactive}
            value={name}
            onChangeText={setName}
            textContentType="name"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.inactive}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={COLORS.inactive}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
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
  loginLink: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  loginText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  loginTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});