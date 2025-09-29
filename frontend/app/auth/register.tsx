import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { AUTH_COLORS, SPACING } from '../styles/theme';
import GradientBorderInput from '../components/forms/GradientBorderInput';
import ErrorBanner from '../components/common/ErrorBanner';
import { SubmitButton } from '../components/forms/SubmitButton';
import { useRegisterAnimations } from '../hooks/useRegisterAnimations';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const {
    errorMessage,
    didSucceed,
    showError,
    triggerSuccess,
    errorBannerStyle,
    buttonScaleStyle,
    successScale,
  } = useRegisterAnimations(() => router.replace('/home'));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need access to your photos to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (isLoading || didSucceed) return;

    if (!email || !username || !password || !confirmPassword) {
      showError('Please fill in all required fields.');
      return;
    }

    if (/\s/.test(username)) {
      showError('Username cannot contain spaces.');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Enter a valid email address.');
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      formData.append('name', name || username);
      formData.append('password', password);

      if (profilePicture) {
        try {
          const uriParts = profilePicture.split('.');
          const fileType = uriParts[uriParts.length - 1];
          if (Platform.OS === 'web') {
            const response = await fetch(profilePicture);
            const blob = await response.blob();
            formData.append('profile_picture', blob as any, `profile-${username}.${fileType}`);
          } else {
            formData.append('profile_picture', {
              uri: profilePicture,
              name: `profile-${username}.${fileType}`,
              type: `image/${fileType.toLowerCase()}`,
            } as any);
          }
        } catch {
          // ignore image errors
        }
      }

      const response = await register(formData);
      if (response && response.user) {
        triggerSuccess();
      } else {
        showError('Registration failed. Try again.');
      }
    } catch (e: any) {
      let msg = 'Registration failed.';
      if (e?.response?.data?.detail) msg = e.response.data.detail;
      else if (typeof e?.message === 'string') msg = e.message;
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <ErrorBanner message={errorMessage} animatedStyle={errorBannerStyle} />

        <View style={styles.formContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Create your account!</Text>
          </View>
          <Text style={styles.subtitle}>Sign up to get started</Text>

            <View style={styles.profileImageContainer}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.profileImageButton}
                disabled={didSucceed}
              >
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={40} color={AUTH_COLORS.inactive} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.profileImageText}>Add profile picture</Text>
            </View>

          <GradientBorderInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            colors={[AUTH_COLORS.primary, AUTH_COLORS.primary]}
            placeholderTextColor={AUTH_COLORS.inactive}
            editable={!didSucceed && !isLoading}
          />
          <GradientBorderInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            textContentType="username"
            colors={[AUTH_COLORS.primary, AUTH_COLORS.primary]}
            placeholderTextColor={AUTH_COLORS.inactive}
            editable={!didSucceed && !isLoading}
          />
          <GradientBorderInput
            placeholder="Full Name (Optional)"
            value={name}
            onChangeText={setName}
            textContentType="name"
            colors={[AUTH_COLORS.primary, AUTH_COLORS.primary]}
            placeholderTextColor={AUTH_COLORS.inactive}
            editable={!didSucceed && !isLoading}
          />
          <GradientBorderInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            colors={[AUTH_COLORS.primary, AUTH_COLORS.primary]}
            placeholderTextColor={AUTH_COLORS.inactive}
            editable={!didSucceed && !isLoading}
          />
          <GradientBorderInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            colors={[AUTH_COLORS.primary, AUTH_COLORS.primary]}
            placeholderTextColor={AUTH_COLORS.inactive}
            editable={!didSucceed && !isLoading}
          />

          {!didSucceed && (
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/auth/login')}
              disabled={isLoading}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          )}

          <SubmitButton
            isLoading={isLoading}
            didSucceed={didSucceed}
            onPress={handleRegister}
            disabled={didSucceed}
            buttonScaleStyle={buttonScaleStyle}
            successScale={successScale}
            idleLabel="Sign Up"
            successLabel="Success"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AUTH_COLORS.background },
  scrollContainer: { flexGrow: 1 },
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
  profileImageContainer: { alignItems: 'center', marginBottom: SPACING.xl },
  profileImageButton: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  profileImage: { width: '100%', height: '100%' },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: AUTH_COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: { color: AUTH_COLORS.text.secondary, fontSize: 14 },
  button: {
    backgroundColor: AUTH_COLORS.primary,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  loginLink: { marginTop: SPACING.xl, alignItems: 'center' },
  loginText: { color: AUTH_COLORS.text.secondary, fontSize: 14 },
  loginTextBold: { color: AUTH_COLORS.primary, fontWeight: '600' },
  titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
});