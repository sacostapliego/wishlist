import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '@/app/styles/theme';
import { useAuth } from '@/app/context/AuthContext';
import userAPI from '@/app/services/user';
import { Header } from '@/app/components/layout/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRefresh } from '@/app/context/RefreshContext';
import { useAppNavigation } from '@/app/hooks/useAppNavigation';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import SuccessBanner from '@/app/components/common/SuccessBanner';
import ErrorBanner from '@/app/components/common/ErrorBanner';

export default function EditPreferences() {
  const router = useRouter();
  const { navigateBack } = useAppNavigation();
  const { triggerRefresh } = useRefresh();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [shoeSize, setShoeSize] = useState(user?.shoe_size || '');
  const [shirtSize, setShirtSize] = useState(user?.shirt_size || '');
  const [pantsSize, setPantsSize] = useState(user?.pants_size || '');
  const [hatSize, setHatSize] = useState(user?.hat_size || '');
  const [ringSize, setRingSize] = useState(user?.ring_size || '');
  const [dressSize, setDressSize] = useState(user?.dress_size || '');
  const [jacketSize, setJacketSize] = useState(user?.jacket_size || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const bannerTranslateY = useSharedValue(-100);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerTranslateY.value }],
  }));

  const showBanner = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMessage(message);
      setErrorMessage('');
    } else {
      setErrorMessage(message);
      setSuccessMessage('');
    }

    bannerTranslateY.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(0, { duration: 2000 }),
      withTiming(-100, { duration: 300 })
    );

    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 2600);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await userAPI.updateUserProfile(user.id, {
        shoe_size: shoeSize.trim() || null,
        shirt_size: shirtSize.trim() || null,
        pants_size: pantsSize.trim() || null,
        hat_size: hatSize.trim() || null,
        ring_size: ringSize.trim() || null,
        dress_size: dressSize.trim() || null,
        jacket_size: jacketSize.trim() || null,
      });

      showBanner('success', 'Size preferences updated');
      
      await refreshUser();
      triggerRefresh();
      
      setTimeout(() => {
        navigateBack('/home/profile');
      }, 1500);
    } catch (error) {
      showBanner('error', 'Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header 
        title="Edit Size Preferences" 
        onBack={() => navigateBack('/home/profile')} 
      />
      
      <SuccessBanner message={successMessage} animatedStyle={bannerStyle} />
      <ErrorBanner message={errorMessage} animatedStyle={bannerStyle} />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.sectionHeader}>Size Preferences</Text>
        <Text style={styles.description}>
          Update your size information to help friends and family find the perfect gifts for you.
        </Text>

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

        <Text style={styles.label}>Dress Size</Text>
        <TextInput
          style={styles.input}
          value={dressSize}
          onChangeText={setDressSize}
          placeholder="e.g. 8"
          placeholderTextColor={COLORS.inactive}
        />

        <Text style={styles.label}>Jacket Size</Text>
        <TextInput
          style={styles.input}
          value={jacketSize}
          onChangeText={setJacketSize}
          placeholder="e.g. M"
          placeholderTextColor={COLORS.inactive}
        />

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  content: { 
    flex: 1 
  },
  contentContainer: { 
    padding: SPACING.md, 
    paddingBottom: SPACING.xl 
  },
  sectionHeader: {
    fontSize: 20,
    marginBottom: SPACING.xs,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  input: {
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  disabledButton: { 
    opacity: 0.6 
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});