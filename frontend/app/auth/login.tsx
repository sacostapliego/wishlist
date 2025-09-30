import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { AUTH_COLORS, SPACING } from '../styles/theme';
import GradientBorderInput from '../components/common/GradientBorderInput';
import ErrorBanner from '../components/common/ErrorBanner';
import { SubmitButton } from '../components/common/SubmitButton';
import { useRegisterAnimations } from '../hooks/useRegisterAnimations';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    errorMessage,
    didSucceed,
    showError,
    triggerSuccess,
    errorBannerStyle,
    buttonScaleStyle,
    successScale,
  } = useRegisterAnimations(() => router.replace('/home'), 500);

  const handleLogin = async () => {
    if (isLoading || didSucceed) return;
    if (!email || !password) {
      showError('Enter email and password.');
      return;
    }
    try {
      setIsLoading(true);
      const response = await login(email, password);
      if (response && response.user) {
        triggerSuccess();
      } else {
        showError('Invalid credentials.');
      }
    } catch (e: any) {
      let msg = 'Login failed.';
      if (e?.response?.data?.detail) msg = e.response.data.detail;
      else if (typeof e?.message === 'string') msg = e.message;
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ErrorBanner message={errorMessage} animatedStyle={errorBannerStyle} />
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <GradientBorderInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          colors={[AUTH_COLORS.primary, AUTH_COLORS.primary]}
          placeholderTextColor={AUTH_COLORS.inactive}
          editable={!didSucceed && !isLoading}
        />
        <GradientBorderInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          colors={[AUTH_COLORS.primary, AUTH_COLORS.primary]}
          placeholderTextColor={AUTH_COLORS.inactive}
          editable={!didSucceed && !isLoading}
        />

        {!didSucceed && (
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/auth/register')}
            disabled={isLoading}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        )}

        <SubmitButton
          isLoading={isLoading}
          didSucceed={didSucceed}
          onPress={handleLogin}
          disabled={didSucceed}
          buttonScaleStyle={buttonScaleStyle}
          successScale={successScale}
          idleLabel="Sign In"
          successLabel="Success"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AUTH_COLORS.background },
  formContainer: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
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
  registerLink: { marginTop: SPACING.xl, alignItems: 'center' },
  registerText: { color: AUTH_COLORS.text.secondary, fontSize: 14 },
  registerTextBold: { color: AUTH_COLORS.primary, fontWeight: '600' },
});