import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';
import { API_URL } from '../../services/api';
import { ItemGridProps } from '@/app/types/items';

export const ItemGrid = ({ 
  items, 
  baseSize, 
  onItemPress, 
  showPrice = true, 
  selectedItems = [], 
  selectionMode = false, 
  wishlistColor 
}: ItemGridProps) => {

  // Get lighter version of wishlist color
  const getLightColor = (wishlistColor: string) => {
    if (!wishlistColor) return 'rgba(255, 255, 255, 0.1)';
    
    // Parse RGB values from the string
    const rgbMatch = wishlistColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return wishlistColor;
    
    // Extract RGB values
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    
    // Make lighter by moving 40% toward white (255,255,255)
    const lighterR = Math.min(255, r + Math.floor((255 - r) * 0.4));
    const lighterG = Math.min(255, g + Math.floor((255 - g) * 0.4));
    const lighterB = Math.min(255, b + Math.floor((255 - b) * 0.4));
    
    return `rgb(${lighterR}, ${lighterG}, ${lighterB})`;
  };

  // Size multiplier based on priority (0-5)
  const getSizeMultiplier = (priority: number) => {
    switch(priority) {
      case 0: return 1;    // base size
      case 1: return 1.05; // slightly larger
      case 2: return 1.1;
      case 3: return 1.15;
      case 4: return 1.2;
      default: return 1;
    }
  };

  // Calculate item size based on priority
  const getItemSize = (priority: number) => {
    return baseSize * getSizeMultiplier(priority);
  };

  // Format price with currency symbol
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '';
    return `$${price.toFixed(2)}`;
  };

  // get wishlist color
  const getCardColor = () => {
    return  wishlistColor ? wishlistColor : COLORS.cardDark;
  }

  return (
    <View style={styles.itemsGrid}>
      {items.map((item) => {
        const itemSize = getItemSize(item.priority);
        const hasImage = item.id && item.image;
        const isSelected = selectedItems?.includes(item.id);


        const cardColor = getCardColor();
        const lighterCardColor = getLightColor(cardColor);

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              { 
                width: itemSize,
              },
              isSelected && styles.selectedCard,
            ]}
            onPress={() => onItemPress?.(item)}
          >
             {selectionMode && (
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
                <View style={[styles.imageWrapper, { backgroundColor: cardColor }]}>
                  <Image 
                    source={{ uri: `${API_URL}wishlist/${item.id}/image` }} 
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={[styles.itemInfo, { backgroundColor: lighterCardColor }]}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  {showPrice && item.price !== undefined && (
                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                  )}
                </View>
              </>
            ) : (
              <View style={[styles.textOnlyContainer, { backgroundColor: cardColor }]}>
                <Text style={styles.textOnlyName} numberOfLines={1}>{item.name}</Text>
                {showPrice && item.price !== undefined && (
                  <Text style={styles.textOnlyPrice}>{formatPrice(item.price)}</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ItemGrid;

const styles = StyleSheet.create({
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemCard: {
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageWrapper: {
    aspectRatio: 1,
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  itemInfo: {
    width: '100%',
    padding: SPACING.sm,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  itemPrice: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  textOnlyContainer: {
    padding: SPACING.md,
    flex: 1,
    justifyContent: 'center',

  },
  textOnlyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  textOnlyPrice: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 2,
  },
});