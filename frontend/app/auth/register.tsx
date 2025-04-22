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
  ScrollView,
  Image,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { AUTH_COLORS, SPACING } from '../styles/theme';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import GradientBorderInput from '../components/forms/GradientBorderInput';

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

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need access to your photos to set a profile picture.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'].Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setProfilePicture(result.assets[0].uri);
    }
  };

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
      
      // Create form data to handle file upload
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      formData.append('name', name || username);
      formData.append('password', password);
      
      // Add profile picture if selected
      if (profilePicture) {
        try {
          // Get the file extension
          const uriParts = profilePicture.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          // For web:
          if (Platform.OS === 'web') {
            try {
              const response = await fetch(profilePicture);
              const blob = await response.blob();
              formData.append('profile_picture', blob, `profile-${username}.${fileType}`);
            } catch (fetchError) {
              console.error("Error creating blob:", fetchError);
            }
          } else {
            // For native (add explicit typing):
            formData.append('profile_picture', {
              uri: profilePicture,
              name: `profile-${username}.${fileType}`,
              type: `image/${fileType.toLowerCase()}`
            } as any);
          }
        } catch (imageError) {
          console.error("Error processing profile image:", imageError);
          // Continue without image if there's an error
        }
      }
      
      const response = await register(formData);
      if (response && response.user) {
        router.replace('/home');
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
          <View style= {styles.titleContainer}>
            <Text style={styles.title}>Create your account!</Text>
          </View>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.profileImageButton}>
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
            colors={[AUTH_COLORS.primary, AUTH_COLORS.secondary]}
            placeholderTextColor={AUTH_COLORS.inactive}
          />
          <GradientBorderInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            textContentType="username"
            colors={[AUTH_COLORS.primary, AUTH_COLORS.secondary]}
            placeholderTextColor={AUTH_COLORS.inactive}
          />
          <GradientBorderInput
            placeholder="Full Name (Optional)"
            value={name}
            onChangeText={setName}
            textContentType="name"
            colors={[AUTH_COLORS.primary, AUTH_COLORS.secondary]}
            placeholderTextColor={AUTH_COLORS.inactive}
          />

          <GradientBorderInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            colors={[AUTH_COLORS.primary, AUTH_COLORS.secondary]}
            placeholderTextColor={AUTH_COLORS.inactive}
          />

          <GradientBorderInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            colors={[AUTH_COLORS.primary, AUTH_COLORS.secondary]}
            placeholderTextColor={AUTH_COLORS.inactive}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.background,
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
    color: AUTH_COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: AUTH_COLORS.text.secondary,
    marginBottom: SPACING.xl,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  profileImageButton: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: AUTH_COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: AUTH_COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    color: AUTH_COLORS.text.secondary,
    fontSize: 14,
  },
  input: {
    height: 56,
    borderRadius: 8,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: AUTH_COLORS.text.primary,
    borderWidth: 2,
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
  loginLink: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  loginText: {
    color: AUTH_COLORS.text.secondary,
    fontSize: 14,
  },
  loginTextBold: {
    color: AUTH_COLORS.primary,
    fontWeight: '600',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
});