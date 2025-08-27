import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';
import { API_URL } from '../../services/api';
import { getLightColor } from '../ui/LightColor';
import { WishlistListViewProps } from '@/app/types/wishlist';


const formatPrice = (price?: number) => {
  if (price === undefined || price === null) return '';
  return `$${price.toFixed(2)}`;
};

export const WishlistListView: React.FC<WishlistListViewProps> = ({
  items,
  onItemPress,
  isSelectionMode,
  selectedItems,
  wishlistColor, 
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {items.map(item => {
        const isSelected = selectedItems.includes(item.id);
        const hasImage = item.id && item.image;
        const itemBackgroundColor = wishlistColor || COLORS.cardDark; // Use wishlistColor or default
        const lighterCardColor = getLightColor(itemBackgroundColor);
        

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemRow,
              { backgroundColor: itemBackgroundColor }, // Apply dynamic background color
              isSelected && styles.selectedItemRow,
              !hasImage && styles.textOnlyItemRow, // Added style for text-only items
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
            {hasImage ? (
              <>
                <View style={[styles.imageContainer, { backgroundColor: lighterCardColor }]}>
                  <Image
                    source={{ uri: `${API_URL}wishlist/${item.id}/image` }}
                    style={styles.itemImage}
                  />
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  {item.price !== undefined && (
                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.textOnlyContainer}>
                <Text style={styles.textOnlyName} numberOfLines={2}>{item.name}</Text>
                {item.price !== undefined && (
                  <Text style={styles.textOnlyPrice}>{formatPrice(item.price)}</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default WishlistListView;

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
    minHeight: 80,
  },
  textOnlyItemRow: {
    justifyContent: 'flex-start',
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
  textOnlyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start', 
    paddingHorizontal: SPACING.md,
  },
  textOnlyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  textOnlyPrice: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});