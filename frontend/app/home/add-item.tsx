import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { wishlistAPI } from '../services/wishlist';
import { WishlistApiResponse } from '../types/lists';
import { useRefresh } from '../context/RefreshContext';
import { SelectList } from 'react-native-dropdown-select-list';
import PrioritySlider from '../components/forms/PrioritySlider';

export default function AddItemScreen() {
  const router = useRouter();

  const { wishlistId: preSelectedWishlistId } = useLocalSearchParams<{ wishlistId: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingWishlists, setLoadingWishlists] = useState(true);
  const [wishlists, setWishlists] = useState<WishlistApiResponse[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [url, setUrl] = useState('');
  const [priority, setPriority] = useState(0);
  const [wishlistId, setWishlistId] = useState(preSelectedWishlistId || '');
  const [image, setImage] = useState<string | null>(null);

  const { triggerRefresh } = useRefresh(); 

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setUrl('');
    setPriority(0);
    setImage(null);
    // Note: We don't reset wishlistId to keep the user's list selection
  };


  // Fetch user's wishlists on component mount
  useEffect(() => {
    // Always ensure the preSelectedWishlistId takes precedence
    if (preSelectedWishlistId) {
      setWishlistId(preSelectedWishlistId);
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
      
      // Set default wishlist if available
      if (response && response.length > 0) {
        setWishlistId(response[0].id);
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

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need access to your photos to add an item image.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // Form validation
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter an item name'
      });
      return;
    }

    if (!wishlistId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a wishlist'
      });
      return;
    }

    setIsLoading(true);

    try {
      const itemData = {
        name: name.trim(),
        description: description.trim() || null,
        price: price ? parseFloat(price) : null,
        url: url.trim() || null,
        priority: priority,
        wishlist_id: wishlistId,
        is_purchased: false
      };

      // Prepare the image if one was selected
      let imageFile;
      if (image) {
        try {
          // Get the file extension
          const uriParts = image.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          // For web:
          if (Platform.OS === 'web') {
            const response = await fetch(image);
            const blob = await response.blob();
            imageFile = blob;
          } else {
            // For native:
            imageFile = {
              uri: image,
              name: `item-${new Date().getTime()}.${fileType}`,
              type: `image/${fileType.toLowerCase()}`
            };
          }
        } catch (imageError) {
          console.error("Error processing image:", imageError);
        }
      }

      // Create item with the API
      const result = await wishlistAPI.createItem(itemData, imageFile as any);
      
      // Trigger refresh to update all components using the refresh context
      triggerRefresh();

      resetForm();
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Item added to wishlist!'
      });
      
      // Navigate back or to the wishlist
      router.replace({
        pathname: '/home/lists/[id]',
        params: { id: wishlistId }
      });
    } catch (error) {
      console.error('Error adding item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (preSelectedWishlistId) {
              // If we came from a specific wishlist, navigate back to it
              router.replace({
                pathname: '/home/lists/[id]',
                params: { id: preSelectedWishlistId }
              });
            } else {
              // Otherwise use default back behavior
              router.back();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Item</Text>
      </View>
      
      <ScrollView 
        style={styles.formContainer}
        contentContainerStyle={styles.formContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Select Wishlist */}
        {!preSelectedWishlistId && (
          <>
            <Text style={styles.label}>Select Wishlist</Text>
            {loadingWishlists ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : wishlists.length > 0 ? (
              <SelectList
                setSelected={(val: string) => setWishlistId(val)}
                data={wishlists.map(list => ({ key: list.id, value: list.title, color: list.color}))}
                save="key"
                placeholder="Select wishlist"
                boxStyles={{
                  borderColor: '#fff',
                  borderRadius: 15,
                  padding: SPACING.md,
                }}
                inputStyles={{ color: COLORS.text.primary }}
                dropdownStyles={{ borderColor: '#fff', borderRadius: 15}}
                dropdownTextStyles={{ color: COLORS.text.primary }}
                search={false}
              />
            ) : (
              <Text style={styles.noListsText}>You don't have any wishlists yet. Create one first!</Text>
            )}
          </>
        )}

        {/* Item Name */}
        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={[styles.input, styles.topAlignedInput]}
          value={name}
          onChangeText={setName}
          placeholder="Enter item name"
          placeholderTextColor={'fff'}
          textAlignVertical="top"
        />

        {/* Image Upload */}
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

        {/* Price */}
        <Text style={styles.label}>Price</Text>
        <TextInput
          style={[styles.input, styles.topAlignedInput]}
          value={price}
          onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ''))}
          placeholder="Enter price"
          placeholderTextColor={'fff'}
          keyboardType="decimal-pad"
          textAlignVertical="top"
        />

        {/* URL */}
        <Text style={styles.label}>Where to find it?</Text>
        <TextInput
          style={[styles.input, styles.topAlignedInput]}
          value={url}
          onChangeText={setUrl}
          placeholder="URL or location"
          placeholderTextColor={'fff'}
          keyboardType="url"
          autoCapitalize="none"
          textAlignVertical="top"
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details about this item"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            multiline
            textAlignVertical="top"
            numberOfLines={4}
          />

        {/* Priority */}
        <PrioritySlider value={priority} onValueChange={setPriority} />

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isLoading || !name || !wishlistId) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={isLoading || !name || !wishlistId}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Add Item</Text>
            </>
          )}
        </TouchableOpacity>
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
  formContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  formContentContainer: {
    paddingBottom: SPACING.xl,
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
  },
  textArea: {
    minHeight: 150,
    fontSize: 14,
    paddingTop: SPACING.sm,
  },
  pickerContainer: {
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: SPACING.md,
  },
  picker: {
    color: COLORS.text.primary,
    height: Platform.OS === 'ios' ? 150 : 50,
    backgroundColor: COLORS.background,
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 15,
  },
  imageUploadButton: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    borderColor: '#fff',
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
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
    marginTop: SPACING.md,
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
  loadingContainer: {
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    height: 50,
  },
  noListsText: {
    color: COLORS.inactive,
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
    padding: SPACING.md,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: SPACING.xs,
  },
  sliderLabel: {
    color: COLORS.text.secondary,
    width: 40,
    textAlign: 'center',
    fontSize: 12,
  },
  placeholder: {
    fontSize: 16,
  },
  topAlignedInput: {
    fontSize: 14,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
});