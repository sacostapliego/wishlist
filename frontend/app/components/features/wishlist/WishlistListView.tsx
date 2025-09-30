import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@/app/styles/theme';
import { API_URL } from '@/app/services/api';
import getLightColor from '../../common/LightColor';
import { getPriorityColor } from '../../common/PriorityColor';
import { WishlistListViewProps } from '@/app/types/wishlist';
import { WishlistFilters, SortOption } from './WishlistFilters';

const formatPrice = (price?: number) => {
  if (price === undefined || price === null) return '';
  return `$${price.toFixed(2)}`;
};

const getPriorityValue = (priority?: string | number): number => {
  if (priority === undefined || priority === null) return 2; // default to medium
  
  const parsed = parseInt(priority.toString(), 10);
  return !isNaN(parsed) && parsed >= 0 && parsed <= 4 ? parsed : 2;
};

export const WishlistListView: React.FC<WishlistListViewProps> = ({
  items,
  onItemPress,
  isSelectionMode,
  selectedItems,
  wishlistColor, 
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('none');

  const sortedItems = useMemo(() => {
    const itemsCopy = [...items];
    
    switch (sortBy) {
      case 'price-high':
        return itemsCopy.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'price-low':
        return itemsCopy.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'priority-high':
        return itemsCopy.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
      default:
        return itemsCopy;
    }
  }, [items, sortBy]);

  const handleSortChange = (newSortOption: SortOption) => {
    setSortBy(newSortOption);
  };

  return (
    <View style={styles.container}>
      <WishlistFilters 
        sortBy={sortBy} 
        onSortChange={handleSortChange} 
        wishlistColor={wishlistColor}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {sortedItems.map(item => {
          const isSelected = selectedItems.includes(item.id);
          const hasImage = item.id && item.image;
          const baseWishlistColor = wishlistColor || COLORS.cardDark;
          
          // Use priority-based color only when priority filter is active
          const itemBackgroundColor = sortBy === 'priority-high' 
            ? getPriorityColor(baseWishlistColor, item.priority)
            : baseWishlistColor;
            
          const lighterCardColor = getLightColor(itemBackgroundColor);

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemRow,
                { backgroundColor: itemBackgroundColor },
                isSelected && styles.selectedItemRow,
                !hasImage && styles.textOnlyItemRow,
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
    </View>
  );
};

export default WishlistListView;

// ...existing styles remain the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
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
    marginBottom: SPACING.xs / 2,
  },
  itemPriority: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
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
    marginBottom: SPACING.xs / 2,
  },
  textOnlyPriority: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});