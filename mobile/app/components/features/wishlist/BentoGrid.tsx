import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/app/styles/theme';
import getLightColor from '../../common/LightColor';
import { BentoGridItem } from './BentoGridItem';
import { WishlistItem } from '@/app/types/wishlist';
import { BentoGridPosition } from '@/app/hooks/useBentoLayout';

type Props = {
  items: WishlistItem[];
  gridPositions: BentoGridPosition[];
  width: number;
  height: number;
  onItemPress: (item: WishlistItem) => void;
  selectedItems?: string[];
  selectionMode?: boolean;
  wishlistColor?: string;
};

const BentoGrid = ({
  items,
  gridPositions,
  width,
  height,
  onItemPress,
  selectedItems = [],
  selectionMode = false,
  wishlistColor,
}: Props) => {
  const cardColor = wishlistColor ? wishlistColor : COLORS.cardDark;
  const lighterCardColor = getLightColor(cardColor);

  return (
    <View style={[styles.bentoContainer, { width, height }]}>
      {gridPositions.map(pos => {
        const { item, width: w, height: h, top, left, titleFontSize, priceFontSize } = pos;
        const isSelected = selectedItems.includes(item.id);
        return (
          <BentoGridItem
            key={item.id}
            item={item}
            style={{ width: w, height: h, top, left, backgroundColor: COLORS.cardGray }}
            isSelected={isSelected}
            selectionMode={selectionMode}
            onItemPress={onItemPress}
            lighterCardColor={lighterCardColor}
            titleFontSize={titleFontSize}
            priceFontSize={priceFontSize}
            formatPrice={(p?: number) => (p == null ? '' : `$${p.toFixed(2)}`)}
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