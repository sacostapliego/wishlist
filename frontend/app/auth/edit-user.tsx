import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../styles/theme';
import { useAuth, userAPI } from '../context/AuthContext';
import { API_URL } from '../services/api';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.id ? `${API_URL}users/${user.id}/profile-image` : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [newImageSelected, setNewImageSelected] = useState(false);
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Needed',
        text2: 'We need access to your photos to update your profile picture'
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setProfileImage(result.assets[0].uri);
      setNewImageSelected(true);
    }
  };
  
  const handleRemoveProfilePicture = () => {
    setProfileImage(null);
    setNewImageSelected(true);
  };
  
  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Name is required'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userData = {
        name: name.trim(),
        username: username.trim(),
        email: email.trim()
      };
      
      await userAPI.updateUserProfile(userData);
      
      // Upload new profile image if selected
      if (newImageSelected) {
        if (profileImage) {
          let imageFile;
          
          if (Platform.OS === 'web') {
            const response = await fetch(profileImage);
            imageFile = await response.blob();
          } else {
            const uriParts = profileImage.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            imageFile = {
              uri: profileImage,
              name: `profile-${new Date().getTime()}.${fileType}`,
              type: `image/${fileType.toLowerCase()}`
            };
          }
          
          await userAPI.updateProfileImage(imageFile as any);
        } else {
          // If profileImage is null, it means the user wants to remove their profile picture
          await userAPI.removeProfileImage();
        }
      }
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully'
      });
      
      // Refresh the user data in context
      await refreshUser();
      
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace('/home/settings')}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={50} color={COLORS.text.secondary} />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
          
          {profileImage && (
            <TouchableOpacity onPress={handleRemoveProfilePicture} style={styles.removeImage}>
              <Text style={styles.removeText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={COLORS.inactive}
        />
        
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Your username"
          placeholderTextColor={COLORS.inactive}
          autoCapitalize="none"
        />
        
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Your email"
          placeholderTextColor={COLORS.inactive}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TouchableOpacity
          style={[styles.saveButton, (isLoading || !name.trim()) && styles.disabledButton]}
          onPress={handleUpdateProfile}
          disabled={isLoading || !name.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImage: {
    marginTop: SPACING.md,
  },
  removeText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  input: {
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});