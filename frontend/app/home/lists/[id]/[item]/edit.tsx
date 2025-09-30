import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@/app/styles/theme';
import { wishlistAPI } from '@/app/services/wishlist';
import Toast from 'react-native-toast-message';
import { useRefresh } from '@/app/context/RefreshContext';
import { Header } from '@/app/components/layout/Header';
import { LoadingState } from '@/app/components/common/LoadingState';
import ItemForm, { ItemFormRef, ItemFormData } from '@/app/components/features/forms/ItemForm';
import { API_URL } from '@/app/services/api';
import { WishlistItemDetails } from '@/app/types/wishlist'; 

export default function EditItemScreen() {
  const router = useRouter();
  const { id: wishlistId, item: itemId } = useLocalSearchParams<{ id: string, item: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<ItemFormData>>({});
  const { triggerRefresh } = useRefresh();
  const formRef = useRef<ItemFormRef>(null);

  useEffect(() => {
    if (!itemId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Item ID is missing.' });
      router.back();
      return;
    }
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
    setIsLoading(true);
    try {
      // Assuming WishlistItemDetails from your types includes 'priority'
      const itemData = await wishlistAPI.getWisihlistItem(itemId as string) as WishlistItemDetails & { priority?: number };
      setInitialValues({
        name: itemData.name,
        description: itemData.description || '',
        price: itemData.price !== undefined && itemData.price !== null ? String(itemData.price) : '',
        url: itemData.url || '',
        currentImageUri: itemData.image ? `${API_URL}wishlist/${itemData.id}/image` : undefined,
        priority: itemData.priority || 0, 
      });
    } catch (error) {
      console.error('Error fetching item details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load item details.',
      });
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (formData: ItemFormData, newImageFile?: File | { uri: string; name: string; type: string }) => {
    if (!itemId) return;
    setIsSubmitting(true);

    const itemDataToUpdate: Partial<WishlistItemDetails & { priority: number }> = { 
      name: formData.name,
      description: formData.description || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      url: formData.url || undefined,
      priority: formData.priority,
    };

    Object.keys(itemDataToUpdate).forEach(key => {
        const k = key as keyof typeof itemDataToUpdate;
        if (itemDataToUpdate[k] === undefined) {
            delete itemDataToUpdate[k];
        }
    });

    try {
      await wishlistAPI.updateItem(itemId, itemDataToUpdate, newImageFile as File); 
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Item updated successfully!',
      });
      triggerRefresh(); 

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/home/lists/${wishlistId}/${itemId}`);
      }
      
    } catch (error) {
      console.error('Error updating item:', error);
      let errorMessage = 'Failed to update item. Please try again.';
      // @ts-ignore
      if (error.response && error.response.data && error.response.data.detail) {
        // @ts-ignore
        errorMessage = typeof error.response.data.detail === 'string' 
        // @ts-ignore
          ? error.response.data.detail 
          // @ts-ignore
          : (Array.isArray(error.response.data.detail) ? error.response.data.detail[0].msg : errorMessage);
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (wishlistId && itemId) {
      router.replace(`/home/lists/${wishlistId}/${itemId}`);
    } else if (wishlistId) {
      router.replace(`/home/lists/${wishlistId}`);
    } else {
        router.replace('/home/lists');
    }
  };

  if (isLoading && !Object.keys(initialValues).length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Loading Item..." onBack={handleBack} />
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} 
    >
      <Header title="Edit Item" onBack={handleBack} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading && Object.keys(initialValues).length > 0 && (
            <View style={styles.formLoadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        )}
        {!isLoading && Object.keys(initialValues).length === 0 && !itemId && (
             <View style={styles.centeredMessage}>
                <Text style={styles.errorText}>Item ID is missing. Cannot load details.</Text>
            </View>
        )}
        {Object.keys(initialValues).length > 0 && (
            <ItemForm
            ref={formRef}
            initialValues={initialValues}
            onSubmit={handleUpdateItem}
            isLoading={isSubmitting}
            submitLabel="Save Changes"
            isEditMode={true}
            />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  formLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
   },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
});