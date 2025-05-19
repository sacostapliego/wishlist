import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../styles/theme';
import { getLightColor } from '../ui/LightColor';
import { BentoGridItem } from './BentoGridItem';
import { useBentoLayout, getBentoGridWidthExport, getBentoGridRenderedHeightExport } from '../../hooks/useBentoLayout'; // Adjust path

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
  wishlistColor,
}: BentoGridProps) => {
  const { gridPositions, containerWidth, containerHeight } = useBentoLayout(items, baseSize);

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '';
    return `$${price.toFixed(2)}`;
  };

  const cardColor = wishlistColor ? wishlistColor : COLORS.cardDark;
  const lighterCardColor = getLightColor(cardColor);

  return (
    <View
      style={[
        styles.bentoContainer,
        {
          width: containerWidth,
          height: containerHeight,
        },
      ]}
    >
      {gridPositions.map((pos) => {
        const { item, width, height, top, left, isCenter, titleFontSize, priceFontSize } = pos;
        const isSelected = selectedItems.includes(item.id);

        return (
          <BentoGridItem
            key={item.id}
            item={item}
            style={{ width, height, top, left, zIndex: isCenter ? 2 : 1, backgroundColor: cardColor }}
            isSelected={isSelected}
            selectionMode={selectionMode}
            onItemPress={onItemPress}
            lighterCardColor={lighterCardColor}
            titleFontSize={titleFontSize}
            priceFontSize={priceFontSize}
            formatPrice={formatPrice}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bentoContainer: {
    position: 'relative',
    // backgroundColor: 'rgba(0,255,0,0.1)', // For debugging layout bounds
  },
});

export { getBentoGridWidthExport as getBentoGridWidth, getBentoGridRenderedHeightExport as getBentoGridRenderedHeight };
export default BentoGrid;