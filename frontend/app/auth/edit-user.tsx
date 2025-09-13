import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter, usePathname} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import userAPI from '../services/user';
import { API_URL } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/layout/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ErrorBanner from '../components/common/ErrorBanner';
import SuccessBanner from '../components/common/SuccessBanner';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useRefresh } from '../context/RefreshContext';


export default function EditProfileScreen() {
  const router = useRouter();
  const { triggerRefresh } = useRefresh();
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');

  // New size states
  const [shoeSize, setShoeSize] = useState(user?.shoe_size || '');
  const [shirtSize, setShirtSize] = useState(user?.shirt_size || '');
  const [pantsSize, setPantsSize] = useState(user?.pants_size || '');
  const [hatSize, setHatSize] = useState(user?.hat_size || '');
  const [ringSize, setRingSize] = useState(user?.ring_size || '');

  const [profileImage, setProfileImage] = useState<string | null>(
    user?.id ? `${API_URL}users/${user.id}/profile-image` : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [newImageSelected, setNewImageSelected] = useState(false);

  // Banner states + simple slide animation
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const errorY = useSharedValue(-80);
  const successY = useSharedValue(-80);
  const errorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: errorY.value }],
  }));
  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: successY.value }],
  }));
  const showError = (msg: string) => {
    setSuccessMessage(undefined);
    successY.value = withTiming(-80, { duration: 200 });
    setErrorMessage(msg);
    errorY.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      errorY.value = withTiming(-80, { duration: 200 });
      setErrorMessage(undefined);
    }, 3000);
  };
  const showSuccess = (msg: string) => {
    setErrorMessage(undefined);
    errorY.value = withTiming(-80, { duration: 200 });
    setSuccessMessage(msg);
    successY.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      successY.value = withTiming(-80, { duration: 200 });
      setSuccessMessage(undefined);
    }, 2500);
  };

  const insets = useSafeAreaInsets();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('We need access to your photos to update your profile picture');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any, // keep current API shape used in your project
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setProfileImage(result.assets[0].uri);
      setNewImageSelected(true);
    }
  };

  const handleRemoveProfilePicture = async () => {
    setIsLoading(true);
    try {
      await userAPI.removeProfileImage(user?.id || '');
      setProfileImage(null);
      setNewImageSelected(false);
      await refreshUser();
      triggerRefresh();
      showSuccess('Profile picture removed');
    } catch (error) {
      showError('Failed to remove profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      showError('Name is required');
      return;
    }
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Send all profile + size fields (multipart)
      await userAPI.updateUserProfile(user.id, {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        shoe_size: shoeSize || null,
        shirt_size: shirtSize || null,
        pants_size: pantsSize || null,
        hat_size: hatSize || null,
        ring_size: ringSize || null
      });

      // Separate image upload if a new local file selected
      if (newImageSelected) {
        if (profileImage) {
          let imageFile: any;
          if (Platform.OS === 'web') {
            const response = await fetch(profileImage);
            const blob = await response.blob();
            imageFile = new File([blob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' });
          } else {
            const uriParts = profileImage.split('.');
            const fileType = uriParts[uriParts.length - 1];
            imageFile = {
              uri: profileImage,
              name: `profile-${Date.now()}.${fileType}`,
              type: `image/${fileType.toLowerCase()}`
            };
          }
          await userAPI.updateProfileImage(imageFile);
        } else {
          await userAPI.removeProfileImage(user.id);
        }
      }

      showSuccess('Profile updated');
      await refreshUser();
      triggerRefresh();
    } catch (error) {
      showError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Banners */}
      <ErrorBanner message={errorMessage} animatedStyle={errorAnimatedStyle} />
      <SuccessBanner message={successMessage} animatedStyle={successAnimatedStyle} />

      <Header title="Edit Profile" onBack={() => router.back()} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper} disabled={isLoading}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={50} color={COLORS.text.secondary} />
              </View>
            )}
          </TouchableOpacity>

          {profileImage && (
            <TouchableOpacity
              onPress={handleRemoveProfilePicture}
              style={styles.removeImageButton}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.removeText}>Remove Photo</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={COLORS.inactive}
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor={COLORS.inactive}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={COLORS.inactive}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Size Inputs */}
        <Text style={styles.sectionHeader}>Sizes (Optional)</Text>

        <Text style={styles.label}>Shoe Size</Text>
        <TextInput
          style={styles.input}
          value={shoeSize}
          onChangeText={setShoeSize}
          placeholder="e.g. 10 US"
          placeholderTextColor={COLORS.inactive}
        />

        <Text style={styles.label}>Shirt Size</Text>
        <TextInput
          style={styles.input}
          value={shirtSize}
          onChangeText={setShirtSize}
          placeholder="e.g. L"
          placeholderTextColor={COLORS.inactive}
        />

        <Text style={styles.label}>Pants Size</Text>
        <TextInput
          style={styles.input}
          value={pantsSize}
          onChangeText={setPantsSize}
          placeholder="e.g. 32x32"
          placeholderTextColor={COLORS.inactive}
        />

        <Text style={styles.label}>Hat Size</Text>
        <TextInput
          style={styles.input}
          value={hatSize}
          onChangeText={setHatSize}
          placeholder="e.g. 7 1/4 / M"
          placeholderTextColor={COLORS.inactive}
        />

        <Text style={styles.label}>Ring Size</Text>
        <TextInput
          style={styles.input}
          value={ringSize}
          onChangeText={setRingSize}
          placeholder="e.g. 9"
          placeholderTextColor={COLORS.inactive}
        />

        <TouchableOpacity
          style={[styles.saveButton, (isLoading || !name.trim()) && styles.disabledButton]}
          onPress={handleUpdateProfile}
          disabled={isLoading || !name.trim()}
        >
          {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
  contentContainer: { padding: SPACING.md, paddingBottom: SPACING.xl },
  profileImageContainer: { alignItems: 'center', marginVertical: SPACING.lg },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden'
  },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeImageButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 140,
  },
  removeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  label: {
    fontSize: 14,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    color: COLORS.text.secondary,
    fontWeight: '500'
  },
  sectionHeader: {
    fontSize: 16,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    color: COLORS.text.primary,
    fontWeight: '600'
  },
  input: {
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl
  },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});