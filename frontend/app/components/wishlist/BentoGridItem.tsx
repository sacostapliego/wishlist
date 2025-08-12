import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';
import { API_URL } from '../../services/api';
import { WishlistItem } from '@/app/types/wishlist';

interface BentoGridItemProps {
  item: WishlistItem;
  style: {
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
  const hasImage = !!item?.id && !!item?.image;

  return (
    <TouchableOpacity
      key={item.id}
      style={[styles.itemCard, style, isSelected && styles.selectedCard]}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.8}
    >
      {selectionMode && (
        <View style={styles.selectionIndicator}>
          <Ionicons
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
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
              resizeMode="contain" // show the whole image
            />
          </View>
          <View style={[styles.itemInfo, { backgroundColor: style.backgroundColor }]}>
            <Text style={[styles.itemName, { fontSize: titleFontSize }]} numberOfLines={1}>
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
        <View style={[styles.textOnlyContainer, { backgroundColor: style.backgroundColor }]}>
          <Text style={[styles.textOnlyName, { fontSize: titleFontSize }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.price !== undefined && (
            <Text style={[styles.textOnlyPrice, { fontSize: priceFontSize }]} numberOfLines={1}>
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
  },
  itemWithImageContainer: {
    flex: 1,
  },
  imageWrapper: {
    flex: 1,               // image area uses remaining space
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    width: '100%',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    minHeight: 52,         // solid bar, no transparency
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