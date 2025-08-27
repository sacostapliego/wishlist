import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../styles/theme';
import { getLightColor } from '../ui/LightColor';
import { BentoGridItem } from './BentoGridItem';
import { useBentoLayout } from '../../hooks/useBentoLayout';
import { BentoGridProps } from '@/app/types/objects';

export const BentoGrid = ({
  items,
  onItemPress,
  selectedItems = [],
  selectionMode = false,
  wishlistColor,
}: Omit<BentoGridProps, 'baseSize'>) => {
  const { gridPositions, containerWidth, containerHeight } = useBentoLayout(items);

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
        const { item, width, height, top, left, titleFontSize, priceFontSize } = pos;
        const isSelected = selectedItems.includes(item.id);

        return (
          <BentoGridItem
            key={item.id}
            item={item}
            style={{ width, height, top, left, backgroundColor: cardColor }}
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
  },
});

export default BentoGrid;