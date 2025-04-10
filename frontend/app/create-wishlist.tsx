import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './context/AuthContext';
import { COLORS, SPACING } from './styles/theme';
import { wishlistAPI } from './services/api.wishlist';
import { Ionicons } from '@expo/vector-icons';
import WishlistForm from './components/forms/WishListForm';

interface WishlistFormData {
  title: string;
  description: string;
  color: string;
  is_public: boolean;
}
  
export default function CreateWishlistScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCreateWishlist = async (wishlistData: WishlistFormData) => {
    setIsLoading(true);
    
    try {
      await wishlistAPI.createWishlist(wishlistData);
      
      //TODO: Go to the created wishlist screen

      // Alert, than navigate
      Alert.alert(
        'Success', 
        'Wishlist created successfully!',
        [{ text: 'OK'
          , onPress: () => {
            // Navigate to the created wishlist screen
            router.replace('/(tabs)');
          }
         }]
      );
    } catch (error) {
      console.error('Error creating wishlist:', error);
      Alert.alert('Error', 'Failed to create wishlist. Please try again.');
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