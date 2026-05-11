import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@/app/styles/theme';
import { wishlistAPI } from '@/app/services/wishlist';
import WishlistForm, { WishlistFormRef } from '@/app/components/features/forms/WishListForm';
import Toast from 'react-native-toast-message';
import { useRefresh } from '@/app/context/RefreshContext';
import { WishlistFormData } from '@/app/types/lists';

export default function EditWishlistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [initialValues, setInitialValues] = useState({});
  const { triggerRefresh, refreshTimestamp } = useRefresh();
  const formRef = useRef<WishlistFormRef>(null);

  useEffect(() => {
    fetchWishlistDetails();
  }, [id, refreshTimestamp]);

  const fetchWishlistDetails = async () => {
    setIsLoading(true); 
    try {
      const wishlistData = await wishlistAPI.getWishlist(id as string);
      setInitialValues({
        title: wishlistData.title,
        description: wishlistData.description,
        color: wishlistData.color,
        isPublic: wishlistData.is_public
      });
    } catch (error) {
      console.error('Error fetching wishlist details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load wishlist details'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWishlist = async (wishlistData: WishlistFormData) => {
    setIsLoading(true);
    try {
      await wishlistAPI.updateWishlist(id as string, wishlistData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Wishlist updated successfully!'
      });
      
      triggerRefresh();
      router.push({
        pathname: `/home/lists/[id]`,
        params: { id }
      });
    } catch (error) {
      console.error('Error updating wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update wishlist'
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
          onPress={() => router.canGoBack() ? router.back() : router.push('/')}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Wishlist</Text>
      </View>
      
      {!isLoading && (
        <WishlistForm
          ref={formRef}
          initialValues={initialValues}
          onSubmit={handleUpdateWishlist}
          isLoading={isLoading}
          submitLabel="Save Changes"
        />
      )}
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