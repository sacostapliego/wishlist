import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
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

type ItemGridProps = {
  items: WishlistItem[];
  baseSize: number;
  onItemPress?: (item: WishlistItem) => void;
  showPrice?: boolean;
  selectedItems?: string[];
  selectionMode?: boolean;
  wishlistColor?: string;
};

export const ItemGrid = ({ 
  items, 
  baseSize, 
  onItemPress, 
  showPrice = true, 
  selectedItems = [], 
  selectionMode = false, 
  wishlistColor 
}: ItemGridProps) => {

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

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              { 
                width: itemSize,
                height: hasImage ? itemSize : Math.min(itemSize * 0.4, 80), 
                backgroundColor: cardColor,
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
                <Image 
                  source={{ uri: `${API_URL}wishlist/${item.id}/image` }} 
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  {showPrice && item.price !== undefined && (
                    <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.textOnlyContainer}>
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
    height: '70%',
  },
  itemInfo: {
    padding: SPACING.sm,
    height: '30%',
    justifyContent: 'space-between',
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