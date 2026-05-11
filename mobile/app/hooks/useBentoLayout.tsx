import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { WishlistItem } from '../types/wishlist';
import { SPACING } from '../styles/theme';
import { useImageDimensions } from './useImageDimensions';

export type BentoGridPosition = {
  item: WishlistItem;
  width: number;
  height: number;
  top: number;
  left: number;
  titleFontSize: number;
  priceFontSize: number;
};

const GAP = SPACING.md;
const INFO_BAR_HEIGHT = 0;
const ITEM_SCALE_WEB = 0.6; // 30% smaller on web only
const CANVAS_PADDING = 300;

export const useBentoLayout = (items: WishlistItem[]) => {
  const { width: screenWidth } = useWindowDimensions();
  const imageDims = useImageDimensions(items);

  const { gridPositions, containerWidth, containerHeight, innerWidth, innerHeight } = useMemo(() => {
    if (!items || items.length === 0) {
      return { gridPositions: [], containerWidth: 0, containerHeight: 0, innerWidth: 0, innerHeight: 0 };
    }

    // Columns responsive by platform
    const horizontalPadding = SPACING.md * 2;
    const workWidth = Math.max(320, screenWidth - horizontalPadding);

    const targetColWidth = Platform.OS === 'web' ? 280 : 170;
    let cols = Math.max(2, Math.floor((workWidth + GAP) / (targetColWidth + GAP)));
    if (Platform.OS === 'web') cols = Math.min(6, Math.max(3, cols));
    else cols = Math.min(3, cols); // 2–3 columns on mobile

    const baseColWidth = Math.floor((workWidth - GAP * (cols - 1)) / cols);

    // Apply 30% shrink only on web
    const scale = Platform.OS === 'web' ? ITEM_SCALE_WEB : 1;
    const colWidth = Math.max(100, Math.floor(baseColWidth * scale));

    const colHeights = new Array(cols).fill(0);
    const positions: BentoGridPosition[] = [];

    const fontSizesFor = (priority: number) => {
      const k = 1 + (priority / 5) * 0.25;
      return {
        titleFontSize: Math.max(12, 14 * k),
        priceFontSize: Math.max(10, 12 * k),
      };
    };

    for (const item of items) {
      const dims = imageDims[item.id];
      const aspect = dims?.aspect ?? 1; // h/w
      const hasImage = !!item.image;

      const imageHeight = Math.round(colWidth * aspect);
      const cardHeight = hasImage
        ? Math.max(140, imageHeight + INFO_BAR_HEIGHT)
        : Math.max(140, imageHeight); // text-only card just uses min height

      const colIndex = colHeights.indexOf(Math.min(...colHeights));
      const top = colHeights[colIndex] + CANVAS_PADDING;
      const left = colIndex * (colWidth + GAP) + CANVAS_PADDING;

      const { titleFontSize, priceFontSize } = fontSizesFor(item.priority);

      positions.push({
        item,
        width: colWidth,
        height: cardHeight,
        top,
        left,
        titleFontSize,
        priceFontSize,
      });

      colHeights[colIndex] += cardHeight + GAP;
    }

    const innerWidth = cols * colWidth + GAP * (cols - 1);
    const innerHeight = Math.max(...colHeights) - GAP + INFO_BAR_HEIGHT;

    const totalWidth = innerWidth + CANVAS_PADDING * 2;
    const totalHeight = innerHeight + CANVAS_PADDING * 2;

    return {
      gridPositions: positions,
      containerWidth: totalWidth,
      containerHeight: totalHeight,
      innerWidth,
      innerHeight,
    };
  }, [items, imageDims, screenWidth]);

  return { gridPositions, containerWidth, containerHeight, innerWidth, innerHeight };
};

export default useBentoLayout;