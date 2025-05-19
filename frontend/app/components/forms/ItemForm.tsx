import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Platform, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import PrioritySlider from './PrioritySlider';
import { SelectList } from 'react-native-dropdown-select-list';
import { WishlistApiResponse } from '@/app/types/lists'; // Assuming this type is available

export interface ItemFormData {
  name: string;
  description?: string;
  price?: string;
  url?: string;
  currentImageUri?: string; 
  newImageUri?: string; 
  priority?: number;
  wishlistId?: string; // Added for wishlist selection
}

interface ItemFormProps {
  initialValues?: Partial<ItemFormData>;
  onSubmit: (data: ItemFormData, imageFile?: File | { uri: string; name: string; type: string }) => void;
  isLoading?: boolean;
  submitLabel?: string;
  // Props for wishlist selection (used in "add" mode)
  wishlists?: WishlistApiResponse[];
  selectedWishlistId?: string;
  onWishlistChange?: (wishlistId: string) => void;
  loadingWishlists?: boolean;
  isEditMode?: boolean; // To conditionally show wishlist selector
  hideWishlistSelector?: boolean;
}

export interface ItemFormRef {
  submitForm: () => void;
  resetForm: () => void;
}

const ItemForm = forwardRef<ItemFormRef, ItemFormProps>(
  (
    {
      initialValues = {},
      onSubmit,
      isLoading = false,
      submitLabel = "Submit",
      wishlists = [],
      selectedWishlistId,
      onWishlistChange,
      loadingWishlists = false,
      isEditMode = false,
      hideWishlistSelector = false,
    },
    ref
  ) => {
    const [name, setName] = useState(initialValues.name || '');
    const [description, setDescription] = useState(initialValues.description || '');
    const [price, setPrice] = useState(initialValues.price || '');
    const [url, setUrl] = useState(initialValues.url || '');
    const [image, setImage] = useState<string | undefined>(initialValues.currentImageUri || initialValues.newImageUri || undefined);
    const [priority, setPriority] = useState(initialValues.priority || 0);

    useEffect(() => {
        setName(initialValues.name || '');
        setDescription(initialValues.description || '');
        setPrice(initialValues.price || '');
        setUrl(initialValues.url || '');
        setImage(initialValues.currentImageUri || initialValues.newImageUri || undefined);
        setPriority(initialValues.priority || 0);
    }, [initialValues]);

    useImperativeHandle(ref, () => ({
      submitForm: handleSubmit,
      resetForm,
    }));

    const resetForm = () => {
      setName(initialValues.name || '');
      setDescription(initialValues.description || '');
      setPrice(initialValues.price || '');
      setUrl(initialValues.url || '');
      setImage(initialValues.currentImageUri || undefined); 
      setPriority(initialValues.priority || 0);
      // Wishlist ID reset should be handled by parent if needed
    };

    const pickImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'We need access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setImage(result.assets[0].uri);
      }
    };

    const handleSubmit = async () => {
      if (!name.trim()) {
        Alert.alert("Validation Error", "Item name is required.");
        return;
      }
      if (!isEditMode && !hideWishlistSelector && !selectedWishlistId) {
        Alert.alert("Validation Error", "Please select a wishlist.");
        return;
      }

      let imageFile: File | { uri: string; name: string; type: string } | undefined = undefined;

      if (image && image !== initialValues.currentImageUri) {
          try {
            const uriParts = image.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            if (Platform.OS === 'web') {
              const response = await fetch(image);
              const blob = await response.blob();
              imageFile = new File([blob], `item-image.${fileType}`, { type: `image/${fileType}` });
            } else { 
              imageFile = {
                uri: image,
                name: `item-image-${Date.now()}.${fileType}`,
                type: `image/${fileType.toLowerCase()}`,
              };
            }
          } catch (imgError) {
            console.error("Error processing image for upload:", imgError);
            Alert.alert("Image Error", "Could not process the selected image.");
            return; 
          }
      }
      
      onSubmit({ name, description, price, url, newImageUri: image, priority, wishlistId: selectedWishlistId }, imageFile);
    };

    return (
      <View style={styles.formContainer}>
        {/* Select Wishlist - Conditionally render if not in edit mode and wishlists are provided */}
        {!isEditMode && !hideWishlistSelector && onWishlistChange && (
          <>
            <Text style={styles.label}>Select Wishlist *</Text>
            {loadingWishlists ? (
              <View style={styles.loadingDropdownContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : wishlists.length > 0 ? (
              <SelectList
                setSelected={onWishlistChange}
                data={wishlists.map(list => ({ key: list.id, value: list.title }))}
                save="key"
                placeholder="Select wishlist"
                boxStyles={styles.dropdownBoxStyles}
                inputStyles={styles.dropdownInputStyles}
                dropdownStyles={styles.dropdownStyles}
                dropdownTextStyles={styles.dropdownTextStyles}
                search={false}
              />
            ) : (
              <Text style={styles.noListsText}>You don't have any wishlists yet. Create one first!</Text>
            )}
          </>
        )}

        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter item name"
          placeholderTextColor={'rgba(255, 255, 255, 0.3)'} // From add-item
        />

        <Text style={styles.label}>Image</Text>
        <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="image-outline" size={40} color={COLORS.inactive} />
              <Text style={styles.uploadText}>Tap to select an image</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ''))}
          placeholder="Enter price (e.g., 29.99)"
          placeholderTextColor={'rgba(255, 255, 255, 0.3)'} // From add-item
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>URL / Where to find it?</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="URL or location" // From add-item
          placeholderTextColor={'rgba(255, 255, 255, 0.3)'} // From add-item
          keyboardType="url"
          autoCapitalize="none"
        />
        
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add details about this item"
          placeholderTextColor="rgba(255, 255, 255, 0.3)" // From add-item
          multiline
          numberOfLines={4} // From add-item
          textAlignVertical="top"
        />
        
        <PrioritySlider value={priority} onValueChange={setPriority} /> 

        <TouchableOpacity
          style={[
            styles.submitButton, 
            (isLoading || !name || (!isEditMode && !hideWishlistSelector && !selectedWishlistId)) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={isLoading || !name || (!isEditMode && !hideWishlistSelector && !selectedWishlistId)}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons 
                name={isEditMode ? "checkmark-circle-outline" : "add-circle-outline"} 
                size={20} 
                color={COLORS.white} 
                style={styles.buttonIcon} 
              />
              <Text style={styles.buttonText}>{submitLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  formContainer: {
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  input: {
    borderRadius: 15,
    borderColor: '#fff',
    borderWidth: 1,
    padding: SPACING.md,
    color: COLORS.text.primary,
    fontSize: 16,
    marginBottom: SPACING.sm,
    paddingTop: SPACING.md,
    textAlignVertical: 'top',
  },
  textArea: {
    minHeight: 100,
  },
  imageUploadButton: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    borderColor: '#fff',
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: COLORS.inactive,
    marginTop: SPACING.md,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg, // Adjusted from md
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
  loadingDropdownContainer: {
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 15,
    padding: SPACING.md,
    height: 50 + (SPACING.md * 2),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dropdownBoxStyles: {
    borderColor: '#fff',
    borderRadius: 15,
    padding: SPACING.md,
  },
  dropdownInputStyles: { 
    color: COLORS.text.primary,
    fontSize: 16,
  },
  dropdownStyles: { 
    borderColor: '#fff', 
    borderRadius: 15,
    backgroundColor: COLORS.background,
  },
  dropdownTextStyles: { 
    color: COLORS.text.primary,
    fontSize: 16,
  },
  noListsText: {
    color: COLORS.inactive,
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
    padding: SPACING.md,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontSize: 14,
  },
});

export default ItemForm;