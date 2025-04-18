import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../styles/theme';
import { wishlistAPI } from '../services/wishlist';
import { Ionicons } from '@expo/vector-icons';
import { WishlistFormData } from '../types/lists';
import WishlistForm from '../components/forms/WishListForm';
import Toast from 'react-native-toast-message';
import { useRefresh } from '../context/RefreshContext';

export default function CreateWishlistScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { triggerRefresh } = useRefresh();

  
  const handleCreateWishlist = async (wishlistData: WishlistFormData) => {
    setIsLoading(true);
    
    try {
      const result = await wishlistAPI.createWishlist(wishlistData);      
      // Alert, than navigate
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Wishlist created successfully!'
      });
      
      // Navigate to the home screen
      triggerRefresh(); // Trigger refresh of all components using this context
      router.replace({
        pathname: `/home/[id]`,
        params: { id: result.id },
      });
    } catch (error) {
      console.error('Error creating wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create wishlist. Please try again.'
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
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Wishlist</Text>
      </View>
      
      <WishlistForm
        onSubmit={handleCreateWishlist}
        isLoading={isLoading}
        submitLabel="Create Wishlist"
      />
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
});