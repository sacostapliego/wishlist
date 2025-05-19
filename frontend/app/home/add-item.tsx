import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { wishlistAPI } from '../services/wishlist';
import { WishlistApiResponse } from '../types/lists';
import { useRefresh } from '../context/RefreshContext';
import ItemForm, { ItemFormData, ItemFormRef } from '../components/forms/ItemForm';

export default function AddItemScreen() {
  const router = useRouter();
  const { wishlistId: preSelectedWishlistId } = useLocalSearchParams<{ wishlistId: string }>();

  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [loadingWishlists, setLoadingWishlists] = useState(true);
  const [wishlists, setWishlists] = useState<WishlistApiResponse[]>([]);
  const [selectedWishlistId, setSelectedWishlistId] = useState(preSelectedWishlistId || '');
  
  const itemFormRef = useRef<ItemFormRef>(null);
  const { triggerRefresh } = useRefresh(); 

  useEffect(() => {
    if (preSelectedWishlistId) {
      setSelectedWishlistId(preSelectedWishlistId);
      setLoadingWishlists(false); 
    } else {
      fetchWishlists();
    }
  }, [preSelectedWishlistId]);

  const fetchWishlists = async () => {
    try {
      setLoadingWishlists(true);
      const response = await wishlistAPI.getWishlists();
      setWishlists(response);
      
      if (!preSelectedWishlistId && response && response.length > 0) {
        setSelectedWishlistId(response[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch wishlists:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load your wishlists.'
      });
    } finally {
      setLoadingWishlists(false);
    }
  };

  const handleAddItemSubmit = async (formData: ItemFormData, imageFile?: File | { uri: string; name: string; type: string }) => {
    setIsSubmitting(true);
    try {
      const itemDataPayload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        url: formData.url?.trim() || null,
        priority: formData.priority,
        wishlist_id: selectedWishlistId,
        is_purchased: false
      };

      await wishlistAPI.createItem(itemDataPayload, imageFile as any);
      
      triggerRefresh();
      itemFormRef.current?.resetForm();
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Item added to wishlist!'
      });
      
      router.replace({
        pathname: '/home/lists/[id]',
        params: { id: selectedWishlistId }
      });

    } catch (error) {
      console.error('Error adding item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackButtonPress = () => {
    if (preSelectedWishlistId) {
      // If coming from a specific wishlist, go back to it
      router.replace(`/home/lists/${preSelectedWishlistId}`);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home/lists'); 
    }
  };

  const initialItemFormValues: Partial<ItemFormData> = {
    name: '',
    description: '',
    price: '',
    url: '',
    priority: 0,
    newImageUri: undefined, // Or null
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} 
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackButtonPress}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Item</Text>
      </View>
      
      <ScrollView 
        style={styles.formScrollView}
        contentContainerStyle={styles.formContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <ItemForm
          ref={itemFormRef}
          initialValues={initialItemFormValues}
          onSubmit={handleAddItemSubmit}
          isLoading={isSubmitting}
          submitLabel="Add Item"
          wishlists={wishlists}
          selectedWishlistId={selectedWishlistId}
          onWishlistChange={setSelectedWishlistId}
          loadingWishlists={loadingWishlists}
          isEditMode={false}
          hideWishlistSelector={!!preSelectedWishlistId}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  formContentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  formScrollView: {
    flex: 1,
  },
});