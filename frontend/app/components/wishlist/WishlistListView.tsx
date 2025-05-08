import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';
import { API_URL } from '../../services/api';

type WishlistItem = {
  id: string;
  name: string;
  image?: string;
  price?: number;
  priority: number;
};

interface WishlistListViewProps {
  items: WishlistItem[];
  onItemPress?: (item: WishlistItem) => void;
  isSelectionMode: boolean;
  selectedItems: string[];
  wishlistColor?: string; 
}

const formatPrice = (price?: number) => {
  if (price === undefined || price === null) return '';
  return `$${price.toFixed(2)}`;
};

export const WishlistListView: React.FC<WishlistListViewProps> = ({
  items,
  onItemPress,
  isSelectionMode,
  selectedItems,
  wishlistColor, // Destructure wishlistColor
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {items.map(item => {
        const isSelected = selectedItems.includes(item.id);
        const hasImage = item.id && item.image;
        const itemBackgroundColor = wishlistColor || COLORS.cardDark; // Use wishlistColor or default

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemRow,
              { backgroundColor: itemBackgroundColor }, // Apply dynamic background color
              isSelected && styles.selectedItemRow,
            ]}
            onPress={() => onItemPress?.(item)}
            disabled={!onItemPress && !isSelectionMode}
          >
            {isSelectionMode && (
              <View style={styles.selectionIndicator}>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={isSelected ? COLORS.primary : COLORS.text.secondary}
                />
              </View>
            )}
            <View style={styles.imageContainer}>
              {hasImage ? (
                <Image
                  source={{ uri: `${API_URL}wishlist/${item.id}/image` }}
                  style={styles.itemImage}
                />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Ionicons name="image-outline" size={30} color={COLORS.inactive} />
                </View>
              )}
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              {item.price !== undefined && (
                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedItemRow: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  selectionIndicator: {
    marginRight: SPACING.sm,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: SPACING.md,
    backgroundColor: COLORS.background,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs / 2,
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});