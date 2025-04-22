import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';
import { API_URL } from '../../services/api';
import { WEB_FRAME_WIDTH } from '@/app/styles/common';

type WishlistItem = {
  id: string;
  name: string;
  image?: string;
  price?: number;
  priority: number;
};

type BentoGridProps = {
  items: WishlistItem[];
  baseSize: number;
  onItemPress?: (item: WishlistItem) => void;
  selectedItems?: string[];
  selectionMode?: boolean;
  wishlistColor?: string;
};


export const BentoGrid = ({
  items,
  baseSize,
  onItemPress,
  selectedItems = [],
  selectionMode = false,
  wishlistColor
}: BentoGridProps) => {
  // Get lighter version of wishlist color
  const getLightColor = (color: string) => {
    if (!color) return 'rgba(255, 255, 255, 0.1)';
    
    // Parse RGB values from the string
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return color;
    
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

  // Format price with currency symbol
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '';
    return `$${price.toFixed(2)}`;
  };

  // Get card color based on wishlist color
  const getCardColor = () => {
    return wishlistColor ? wishlistColor : COLORS.cardDark;
  };

  // Get appropriate width based on platform
  const getGridWidth = () => {
    // For web, use the frame width
    if (Platform.OS === 'web') {
      return WEB_FRAME_WIDTH * 1.5; // 1.5x the frame width for horizontal scrolling
    }
    // For native, use the device width
    return Dimensions.get('window').width * 2;
  };

  // Get appropriate height based on platform
  const getGridHeight = () => {
    if (Platform.OS === 'web') {
      // Using a percentage of frame height (which is 95% of window height per your FrameContext)
      return Dimensions.get('window').height * 0.5;
    }
    return Dimensions.get('window').height * 0.5;
  };

  // Position items in a bento grid layout
  const positionItems = () => {
    const gridWidth = getGridWidth();
    
    // Calculate sizes based on grid dimensions
    const cardBaseSize = Platform.OS === 'web' 
      ? (WEB_FRAME_WIDTH / 3) // Base size for web is around 1/3 of frame
      : baseSize * 1.2;
      
    const smallSize = cardBaseSize * 0.8;
    const mediumSize = cardBaseSize;
    const largeSize = cardBaseSize * 1.5;
    const gapSize = SPACING.md;
    
    // Create a grid with absolute positions
    // Start with a focal point in the middle
    let positions: any[] = [];
    
    // Center point for the first item
    const centerX = gridWidth / 2;
    
    if (items.length > 0) {
      // Position the first item in the center
      positions.push({
        item: items[0],
        width: largeSize,
        height: largeSize,
        top: gapSize,
        left: centerX - largeSize / 2,
        isFeatured: true
      });
    }
    
    // Position remaining items around the center
    let currentIndex = 1;
    let currentTop = gapSize;
    let currentLeft = centerX - largeSize / 2 - gapSize - mediumSize;
    
    // Left column
    if (currentIndex < items.length) {
      positions.push({
        item: items[currentIndex++],
        width: mediumSize,
        height: mediumSize,
        top: currentTop,
        left: currentLeft
      });
    }
    
    if (currentIndex < items.length) {
      positions.push({
        item: items[currentIndex++],
        width: mediumSize,
        height: smallSize,
        top: currentTop + mediumSize + gapSize,
        left: currentLeft
      });
    }
    
    // Right column
    currentLeft = centerX + largeSize / 2 + gapSize;
    currentTop = gapSize;
    
    if (currentIndex < items.length) {
      positions.push({
        item: items[currentIndex++],
        width: smallSize,
        height: smallSize,
        top: currentTop,
        left: currentLeft
      });
    }
    
    if (currentIndex < items.length) {
      positions.push({
        item: items[currentIndex++],
        width: smallSize,
        height: mediumSize,
        top: currentTop + smallSize + gapSize,
        left: currentLeft
      });
    }
    
    // Bottom row
    currentTop = gapSize + largeSize + gapSize;
    currentLeft = centerX - largeSize / 2;
    
    if (currentIndex < items.length) {
      positions.push({
        item: items[currentIndex++],
        width: mediumSize,
        height: mediumSize,
        top: currentTop,
        left: currentLeft
      });
    }
    
    // Additional items - add them in a grid pattern
    const extraItemSize = smallSize;
    let rowItems = 4; // Items per row for the rest
    let extraCurrentTop = currentTop + mediumSize + gapSize;
    let extraCurrentLeft = centerX - (extraItemSize * rowItems + gapSize * (rowItems - 1)) / 2;
    
    while (currentIndex < items.length) {
      for (let i = 0; i < rowItems && currentIndex < items.length; i++) {
        positions.push({
          item: items[currentIndex++],
          width: extraItemSize,
          height: extraItemSize,
          top: extraCurrentTop,
          left: extraCurrentLeft + i * (extraItemSize + gapSize)
        });
      }
      extraCurrentTop += extraItemSize + gapSize;
    }
    
    return positions;
  };

  const gridPositions = positionItems();
  const cardColor = getCardColor();
  const lighterCardColor = getLightColor(cardColor);
  
  return (
    <View 
      style={[
        styles.bentoContainer,
        { 
          width: getGridWidth(),
          height: getGridHeight()
        }
      ]}
    >
      {gridPositions.map((position) => {
        const { item, width, height, top, left, isFeatured } = position;
        const isSelected = selectedItems.includes(item.id);
        const hasImage = item.id && item.image;
        
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              {
                width,
                height,
                top,
                left,
                zIndex: isFeatured ? 2 : 1,
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
                  <Text 
                    style={[
                      styles.itemName, 
                      isFeatured && styles.featuredItemName
                    ]} 
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.price !== undefined && (
                    <Text 
                      style={[
                        styles.itemPrice,
                        isFeatured && styles.featuredItemPrice
                      ]}
                    >
                      {formatPrice(item.price)}
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <View style={[styles.textOnlyContainer, { backgroundColor: cardColor }]}>
                <Text 
                  style={[
                    styles.textOnlyName,
                    isFeatured && styles.featuredItemName
                  ]} 
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                {item.price !== undefined && (
                  <Text 
                    style={[
                      styles.textOnlyPrice,
                      isFeatured && styles.featuredItemPrice
                    ]}
                  >
                    {formatPrice(item.price)}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const getBentoGridWidth = () => {
  return Platform.OS === 'web' ? WEB_FRAME_WIDTH * 1.5 : Dimensions.get('window').width * 2;
};

export default BentoGrid;

const styles = StyleSheet.create({
  bentoContainer: {
    position: 'relative',
  },
  itemCard: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageWrapper: {
    height: '70%',
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    marginTop: 2,
  },
  textOnlyContainer: {
    width: '100%',
    height: '100%',
    padding: SPACING.md,
    justifyContent: 'center',
  },
  textOnlyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  textOnlyPrice: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
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
  featuredItemName: {
    fontSize: 18,
  },
  featuredItemPrice: {
    fontSize: 14,
  }
});