import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { wishlistAPI } from '../services/wishlist';
import { WishlistApiResponse } from '../types/lists';
import { useRefresh } from '../context/RefreshContext';
import ItemForm, { ItemFormData, ItemFormRef } from '../components/features/forms/ItemForm';
import ScrapeUrlForm from '../components/features/forms/ScrapeUrlForm';

export default function AddItemScreen() {
  const router = useRouter();
  const { wishlistId: preSelectedWishlistId } = useLocalSearchParams<{ wishlistId: string }>();

  const [addMode, setAddMode] = useState<'manual' | 'link'>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [loadingWishlists, setLoadingWishlists] = useState(true);
  const [wishlists, setWishlists] = useState<WishlistApiResponse[]>([]);
  const [selectedWishlistId, setSelectedWishlistId] = useState(preSelectedWishlistId || '');
  
  const itemFormRef = useRef<ItemFormRef>(null);
  const { triggerRefresh } = useRefresh(); 
  const [initialItemFormValues, setInitialItemFormValues] = useState<Partial<ItemFormData>>({
    name: '',
    description: '',
    price: '',
    url: '',
    priority: 0,
    newImageUri: undefined,
  });

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

  const handleScrapeSuccess = (data: Partial<ItemFormData>) => {
    setInitialItemFormValues(data);
    setAddMode('manual'); // Switch to manual form to show results
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
      setInitialItemFormValues({
        name: '',
        description: '',
        price: '',
        url: '',
        priority: 0,
        newImageUri: undefined,
      });

      if (itemFormRef.current) {
        itemFormRef.current.resetForm();
      }
      
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
      router.replace(`/home/lists/${preSelectedWishlistId}`);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home/lists'); 
    }
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

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, addMode === 'manual' && styles.activeToggleButton]}
          onPress={() => setAddMode('manual')}
        >
          <Text style={[styles.toggleButtonText, addMode === 'manual' && styles.activeToggleButtonText]}>Manual</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, addMode === 'link' && styles.activeToggleButton]}
          onPress={() => setAddMode('link')}
        >
          <Text style={[styles.toggleButtonText, addMode === 'link' && styles.activeToggleButtonText]}>From Link</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.formScrollView}
        contentContainerStyle={styles.formContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {addMode === 'manual' ? (
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
        ) : (
          <ScrapeUrlForm onScrapeSuccess={handleScrapeSuccess} />
        )}
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
    paddingHorizontal: SPACING.md,
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
    marginHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.text.secondary,
  },
  activeToggleButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleButtonText: {
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  activeToggleButtonText: {
    color: COLORS.white,
  },
  formContentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  formScrollView: {
    flex: 1,
  },
});