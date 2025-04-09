import React, { useState } from 'react';
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
import { COLORS, SPACING } from '../../styles/theme';
import { Button } from '../ui/Button';
import { Ionicons } from '@expo/vector-icons';

// Color options for wishlists
const COLOR_OPTIONS = [
  '#ff7f50', // coral
  '#20b2aa', // light sea green
  '#9370db', // medium purple
  '#f08080', // light coral
  '#3cb371', // medium sea green
  '#6495ed', // cornflower blue
  '#ffa07a', // light salmon
  '#ff6347', // tomato
];

interface WishlistFormProps {
  initialValues?: {
    title?: string;
    description?: string;
    color?: string;
    isPublic?: boolean;
  };
  onSubmit: (values: {
    title: string;
    description: string;
    color: string;
    is_public: boolean;
  }) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
}

export default function WishlistForm({
  initialValues = {},
  onSubmit,
  isLoading,
  submitLabel = "Save Wishlist"
}: WishlistFormProps) {
  const [title, setTitle] = useState(initialValues.title || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [isPublic, setIsPublic] = useState(initialValues.isPublic || false);
  const [selectedColor, setSelectedColor] = useState(initialValues.color || '#ff7f50');
  
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
}

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
    backgroundColor: COLORS.cardDark,
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
  },
});