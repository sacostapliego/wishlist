import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';
import { API_URL } from '../../services/api';

const WEB_FRAME_WIDTH = 900; // Assumed max width for web

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
  
  // Get lighter version of wishlist color for text container
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

  // Get card background color based on wishlist color
  const getCardColor = () => {
    return wishlistColor ? wishlistColor : COLORS.cardDark;
  };

  // Get appropriate grid width based on platform
  const getGridWidth = () => {
    if (Platform.OS === 'web') {
      return WEB_FRAME_WIDTH * 1.2; // Provide horizontal scrolling space
    }
    return Dimensions.get('window').width * 3;
  };

  // Get appropriate grid height based on platform
  const getGridHeight = () => {
    if (Platform.OS === 'web') {
      return Dimensions.get('window').height * 1.2;
    }
    return Dimensions.get('window').height * 1.2;
  };

  // Size multiplier based on priority (0-5) - same as ItemGrid
  const getSizeMultiplier = (priority: number) => {
    switch(priority) {
      case 0: return Platform.OS === 'web' ? 0.75 : 0.60;
      case 1: return Platform.OS === 'web' ? 0.85 : 0.64;
      case 2: return Platform.OS === 'web' ? 0.95 : 0.68;
      case 3: return Platform.OS === 'web' ? 1 : 0.72;
      case 4: return Platform.OS === 'web' ? 1.1 : 0.76;
      default: return 1;
    }
  };

  // Font size based on priority
  const getFontSize = (priority: number, isTitle = true) => {
    const baseFontSize = isTitle ? 20 : 16;
    return baseFontSize * getSizeMultiplier(priority);
  };

  // Calculate item size based on priority
  const getItemSize = (priority: number) => {
    return baseSize * getSizeMultiplier(priority);
  };

  // Position items in a bento grid layout
  const positionItems = () => {
    const gridWidth = getGridWidth();
    const gridHeight = getGridHeight();
    
    // Sort items by priority (highest first)
    const sortedItems = [...items].sort((a, b) => b.priority - a.priority);
    
    // Center point for the grid
    const centerX = gridWidth / 2;
    const centerY = gridHeight / 2.5;
    
    // Common spacing between items
    const gapSize = SPACING.md;
    
    // Create a grid with absolute positions
    let positions: any[] = [];
    let currentIndex = 0;
    
    // First item in center
    if (currentIndex < sortedItems.length) {
      const centerItemSize = getItemSize(sortedItems[currentIndex].priority);
      positions.push({
        item: sortedItems[currentIndex++],
        width: centerItemSize,
        height: centerItemSize,
        top: centerY - centerItemSize / 2,
        left: centerX - centerItemSize / 2,
        isCenter: true // Flag for the center item
      });
    }
    
    // Left item
    if (currentIndex < sortedItems.length) {
      const itemSize = getItemSize(sortedItems[currentIndex].priority);
      const centerItemSize = getItemSize(sortedItems[0].priority);
      positions.push({
        item: sortedItems[currentIndex++],
        width: itemSize,
        height: itemSize,
        top: centerY - itemSize / 2, // Align vertically with center item
        left: centerX - centerItemSize / 2 - gapSize - itemSize, // Position to the left
      });
    }
    
    // Right item
    if (currentIndex < sortedItems.length) {
      const itemSize = getItemSize(sortedItems[currentIndex].priority);
      const centerItemSize = getItemSize(sortedItems[0].priority);
      positions.push({
        item: sortedItems[currentIndex++],
        width: itemSize,
        height: itemSize,
        top: centerY - itemSize / 2, // Align vertically with center item
        left: centerX + centerItemSize / 2 + gapSize, // Position to the right
      });
    }
    
    // Top item
    if (currentIndex < sortedItems.length) {
      const itemSize = getItemSize(sortedItems[currentIndex].priority);
      const centerItemSize = getItemSize(sortedItems[0].priority);
      positions.push({
        item: sortedItems[currentIndex++],
        width: itemSize,
        height: itemSize,
        top: centerY - centerItemSize / 2 - gapSize - itemSize, // Position above
        left: centerX - itemSize / 2, // Centered horizontally
      });
    }
    
    // Bottom item
    if (currentIndex < sortedItems.length) {
      const itemSize = getItemSize(sortedItems[currentIndex].priority);
      const centerItemSize = getItemSize(sortedItems[0].priority);
      positions.push({
        item: sortedItems[currentIndex++],
        width: itemSize,
        height: itemSize,
        top: centerY + centerItemSize / 2 + gapSize, // Position below
        left: centerX - itemSize / 2, // Centered horizontally
      });
    }
    
    // Bottom left item
    if (currentIndex < sortedItems.length) {
      const itemSize = getItemSize(sortedItems[currentIndex].priority);
      const centerItemSize = getItemSize(sortedItems[0].priority);
      positions.push({
        item: sortedItems[currentIndex++],
        width: itemSize,
        height: itemSize,
        top: centerY + centerItemSize / 2 + gapSize, // Position below
        left: centerX - centerItemSize / 2 - gapSize - itemSize, // Position to the left
      });
    }
    
    // Bottom right item
    if (currentIndex < sortedItems.length) {
      const itemSize = getItemSize(sortedItems[currentIndex].priority);
      const centerItemSize = getItemSize(sortedItems[0].priority);
      positions.push({
        item: sortedItems[currentIndex++],
        width: itemSize,
        height: itemSize,
        top: centerY + centerItemSize / 2 + gapSize, // Position below
        left: centerX + centerItemSize / 2 + gapSize, // Position to the right
      });
    }
    
    // Additional items in a grid below
    const rowItemsCount = 3;
    let rowStartTop = centerY + getItemSize(sortedItems[0].priority) / 2 + getItemSize(5) + (gapSize * 2);
    
    while (currentIndex < sortedItems.length) {
      const itemsInThisRow = Math.min(rowItemsCount, sortedItems.length - currentIndex);
      const rowItems = [];
      let totalRowWidth = 0;
      
      // Calculate sizes for this row
      for (let i = 0; i < itemsInThisRow; i++) {
        const itemSize = getItemSize(sortedItems[currentIndex + i].priority);
        rowItems.push(itemSize);
        totalRowWidth += itemSize;
      }
      
      totalRowWidth += (itemsInThisRow - 1) * gapSize; // Add gaps
      
      // Position items in this row
      let currentLeft = centerX - totalRowWidth / 2;
      for (let i = 0; i < itemsInThisRow; i++) {
        const itemSize = rowItems[i];
        positions.push({
          item: sortedItems[currentIndex++],
          width: itemSize,
          height: itemSize,
          top: rowStartTop,
          left: currentLeft,
        });
        currentLeft += itemSize + gapSize;
      }
      
      // Move to next row
      rowStartTop += getItemSize(5) + gapSize;
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
        const { item, width, height, top, left, isCenter } = position;
        const isSelected = selectedItems.includes(item.id);
        const hasImage = item.id && item.image;
        
        // Dynamic font sizes based on priority
        const titleFontSize = getFontSize(item.priority, true);
        const priceFontSize = getFontSize(item.priority, false);
        
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
                zIndex: isCenter ? 2 : 1,
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
              <View style={styles.itemWithImageContainer}>
                <View style={[styles.imageWrapper, { backgroundColor: cardColor }]}>
                <Image
                  source={{ uri: `${API_URL}wishlist/${item.id}/image` }}
                  style={styles.itemImage}
                  resizeMode="contain"
                />
                </View>
                <View style={[styles.itemInfo, { backgroundColor: lighterCardColor }]}>
                  <Text 
                    style={[
                      styles.itemName,
                      { fontSize: titleFontSize }
                    ]} 
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.price !== undefined && (
                    <Text 
                      style={[
                        styles.itemPrice,
                        { fontSize: priceFontSize }
                      ]}
                    >
                      {formatPrice(item.price)}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={[styles.textOnlyContainer, { backgroundColor: cardColor }]}>
                <Text 
                  style={[
                    styles.textOnlyName,
                    { fontSize: titleFontSize }
                  ]} 
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                {item.price !== undefined && (
                  <Text 
                    style={[
                      styles.textOnlyPrice,
                      { fontSize: priceFontSize }
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
  if (Platform.OS === 'web') {
    return WEB_FRAME_WIDTH * 1.2;
  }
  return Dimensions.get('window').width * 1.5;
};

export default BentoGrid;

const styles = StyleSheet.create({
  bentoContainer: {
    position: 'relative',
  },
  itemCard: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemWithImageContainer: {
    flex: 1,
    flexDirection: 'column',
    width: 'auto',
  },
  imageWrapper: {
    height: '70%',
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  itemInfo: {
    width: '100%',
    padding: SPACING.sm,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  itemName: {
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  itemPrice: {
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
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  textOnlyPrice: {
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
});