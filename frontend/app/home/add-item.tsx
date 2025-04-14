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
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { wishlistAPI } from '../services/wishlist';
import { WishlistApiResponse } from '../types/lists';
import { useRefresh } from '../context/RefreshContext';

export default function AddItemScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingWishlists, setLoadingWishlists] = useState(true);
  const [wishlists, setWishlists] = useState<WishlistApiResponse[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [url, setUrl] = useState('');
  const [priority, setPriority] = useState('0');
  const [wishlistId, setWishlistId] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const { triggerRefresh } = useRefresh(); // Add this line to use the refresh context


  // Fetch user's wishlists on component mount
  useEffect(() => {
    fetchWishlists();
  }, []);

  const fetchWishlists = async () => {
    try {
      setLoadingWishlists(true);
      const response = await wishlistAPI.getWishlists();
      console.log("Fetched wishlists:", response);
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
        priority: parseInt(priority, 10),
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
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Item added to wishlist!'
      });
      
      // Navigate back or to the wishlist
      router.replace({
        pathname: '/home/[id]',
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
          onPress={() => router.back()}
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
        <Text style={styles.label}>Select Wishlist</Text>
        {loadingWishlists ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : wishlists.length > 0 ? (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={wishlistId}
              onValueChange={(value) => setWishlistId(value)}
              style={styles.picker}
              dropdownIconColor={COLORS.text.primary}
            >
              {wishlists.map((list) => (
                <Picker.Item 
                  key={list.id} 
                  label={list.title} 
                  value={list.id}
                  color={Platform.OS === 'ios' ? COLORS.text.dark : undefined} 
                />
              ))}
            </Picker>
          </View>
        ) : (
          <Text style={styles.noListsText}>You don't have any wishlists yet. Create one first!</Text>
        )}

        {/* Item Name */}
        <Text style={styles.label}>Item Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter item name"
          placeholderTextColor={COLORS.inactive}
        />

        {/* Description */}
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add details about this item"
          placeholderTextColor={COLORS.inactive}
          multiline
          textAlignVertical="top"
          numberOfLines={4}
        />

        {/* Price */}
        <Text style={styles.label}>Price (Optional)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ''))}
          placeholder="Enter price"
          placeholderTextColor={COLORS.inactive}
          keyboardType="decimal-pad"
        />

        {/* URL */}
        <Text style={styles.label}>URL (Optional)</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="Enter item URL"
          placeholderTextColor={COLORS.inactive}
          keyboardType="url"
          autoCapitalize="none"
        />

        {/* Priority */}
        <Text style={styles.label}>Priority (0-5)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={priority}
            onValueChange={(value) => setPriority(value)}
            style={styles.picker}
            dropdownIconColor={COLORS.text.primary}
          >
            <Picker.Item label="0 - Low" value="0" color={Platform.OS === 'ios' ? COLORS.text.primary : undefined} />
            <Picker.Item label="1" value="1" color={Platform.OS === 'ios' ? COLORS.text.primary : undefined} />
            <Picker.Item label="2" value="2" color={Platform.OS === 'ios' ? COLORS.text.primary : undefined} />
            <Picker.Item label="3" value="3" color={Platform.OS === 'ios' ? COLORS.text.primary : undefined} />
            <Picker.Item label="4" value="4" color={Platform.OS === 'ios' ? COLORS.text.primary : undefined} />
            <Picker.Item label="5 - High" value="5" color={Platform.OS === 'ios' ? COLORS.text.primary : undefined} />
          </Picker>
        </View>

        {/* Image Upload */}
        <Text style={styles.label}>Item Image (Optional)</Text>
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
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.text.primary,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  textArea: {
    minHeight: 100,
  },
  pickerContainer: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  picker: {
    color: COLORS.text.primary,
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  imageUploadButton: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.cardDark,
    borderRadius: 8,
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
    backgroundColor: COLORS.cardDark,
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
});