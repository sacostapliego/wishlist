import React, { useState , useImperativeHandle, forwardRef} from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, WISHLIST_COLORS } from '../../styles/theme';
import { Button } from '../ui/Button';
import { WishlistFormProps } from '@/app/types/lists';

// Color options for wishlists
const COLOR_OPTIONS = Object.values(WISHLIST_COLORS);

export type WishlistFormRef = {
  resetForm: () => void;
};

const WishlistForm = forwardRef<WishlistFormRef, WishlistFormProps>(({
  initialValues = {},
  onSubmit,
  isLoading,
  submitLabel = "Save Wishlist"
}, ref) => {
  const [title, setTitle] = useState(initialValues.title || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [isPublic, setIsPublic] = useState(initialValues.isPublic || false);
  const [selectedColor, setSelectedColor] = useState(initialValues.color || '#ff7f50');
  const [privacy, setPrivacy] = useState('private');
  
  const handleSubmit = async () => {
    // Basic validation
    if (!title.trim()) return;
    
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      color: selectedColor,
      is_public: isPublic
    });
  };

   // Create a function to reset the form state
   const resetForm = () => {
    setTitle('');
    setDescription('');
    setIsPublic(false);
  };
  
  // Expose the resetForm method to parent components
  useImperativeHandle(ref, () => ({
    resetForm
  }));
  
  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="My Wishlist"
        placeholderTextColor={COLORS.inactive}
      />
      
      <Text style={styles.label}>Description (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="What's this wishlist for?"
        placeholderTextColor={COLORS.inactive}
        multiline
        textAlignVertical="top"
        numberOfLines={4}
      />
      
      <Text style={styles.label}>Color</Text>
      <View style={styles.colorContainer}>
        {COLOR_OPTIONS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColor
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Make Public</Text>
        <Switch
          trackColor={{ false: COLORS.inactive, true: COLORS.primary }}
          thumbColor={'#ffffff'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={setIsPublic}
          value={isPublic}
        />
      </View>
      
      <Button
        title={submitLabel}
        onPress={handleSubmit}
        icon="checkmark-circle"
        style={styles.submitButton}
        loading={isLoading}
        disabled={isLoading || !title.trim()}
      />
    </ScrollView>
  );
});

export default WishlistForm;

const styles = StyleSheet.create({
  formContainer: {
    padding: SPACING.md,
  },
  label: {
    fontSize: 16,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  input: {
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  textArea: {
    height: 100,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 8,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.primary,
  },
});