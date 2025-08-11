import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme'; // Adjust path as needed
import { API_URL } from '../../services/api'; // Adjust path as needed
import { WishlistItem } from '@/app/types/wishlist';

interface BentoGridItemProps {
  item: WishlistItem;
  style: { // Style props passed from the layout hook
    width: number;
    height: number;
    top: number;
    left: number;
    zIndex?: number;
    backgroundColor: string;
  };
  isSelected: boolean;
  selectionMode: boolean;
  onItemPress?: (item: WishlistItem) => void;
  lighterCardColor: string;
  titleFontSize: number;
  priceFontSize: number;
  formatPrice: (price?: number) => string;
}

export const BentoGridItem: React.FC<BentoGridItemProps> = ({
  item,
  style,
  isSelected,
  selectionMode,
  onItemPress,
  lighterCardColor,
  titleFontSize,
  priceFontSize,
  formatPrice,
}) => {
  const hasImage = item.id && item.image;

  return (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.itemCard,
        style, // Apply dynamic layout styles
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
          <View style={[styles.imageWrapper, { backgroundColor: lighterCardColor }]}>
            <Image
              source={{ uri: `${API_URL}wishlist/${item.id}/image` }}
              style={styles.itemImage}
              resizeMode="contain"
            />
          </View>
          <View style={[styles.itemInfo]}>
            <Text
              style={[styles.itemName, { fontSize: titleFontSize }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.price !== undefined && (
              <Text style={[styles.itemPrice, { fontSize: priceFontSize }]}>
                {formatPrice(item.price)}
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View style={[styles.textOnlyContainer, { backgroundColor: style.backgroundColor /* Use card color */ }]}>
          <Text
            style={[styles.textOnlyName, { fontSize: titleFontSize }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {item.price !== undefined && (
            <Text style={[styles.textOnlyPrice, { fontSize: priceFontSize }]}>
              {formatPrice(item.price)}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    // boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // For web
  },
  itemWithImageContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  imageWrapper: {
    height: '70%',
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    padding: SPACING.sm,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', 
    minHeight: 50,
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
    alignItems: 'center',
  },
  textOnlyName: {
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  textOnlyPrice: {
    color: COLORS.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  selectionIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 2,
  },
});

export default BentoGridItem;