import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { WishlistItem } from '../types/wishlist';
import { SPACING } from '../styles/theme';

export type BentoGridPosition = {
  item: WishlistItem;
  width: number;
  height: number;
  top: number;
  left: number;
  titleFontSize: number;
  priceFontSize: number;
};

// Configuration
const GAP_SIZE = SPACING.md;
const BASE_ITEM_WIDTH = Platform.OS === 'web' ? 250 : 160;
const BASE_ITEM_HEIGHT = 150;

/**
 * A hook to calculate a packed layout for a bento grid.
 * This algorithm places items to minimize grid size.
 * @param items - The array of wishlist items.
 * @returns An object containing the calculated positions and the total container dimensions.
 */
export const useBentoLayout = (items: WishlistItem[]) => {
  const { width: screenWidth } = useWindowDimensions();

  const { gridPositions, containerWidth, containerHeight } = useMemo(() => {
    if (!items || items.length === 0) {
      return { gridPositions: [], containerWidth: 0, containerHeight: 0 };
    }

    const positions: BentoGridPosition[] = [];
    const occupied = new Set<string>(); // "x,y" coordinates of occupied cells

    let finalWidth = 0;
    let finalHeight = 0;

    const getDynamicSize = (priority: number) => {
      const multiplier = 1 + (priority / 5) * 0.5;
      return {
        width: BASE_ITEM_WIDTH * (1 + (priority / 5) * 0.2),
        height: BASE_ITEM_HEIGHT * multiplier,
      };
    };

    const getFontSizes = (priority: number) => {
      const sizeMultiplier = 1 + (priority / 5) * 0.3;
      return {
        titleFontSize: Math.max(12, 14 * sizeMultiplier),
        priceFontSize: Math.max(10, 12 * sizeMultiplier),
      };
    };

    items.forEach((item) => {
      const { width, height } = getDynamicSize(item.priority);
      const { titleFontSize, priceFontSize } = getFontSizes(item.priority);

      let bestPosition = { x: Infinity, y: Infinity, score: Infinity };

      // Search for the best position (top-most, then left-most)
      for (let y = 0; y < finalHeight + BASE_ITEM_HEIGHT; y += GAP_SIZE) {
        for (let x = 0; x < finalWidth + BASE_ITEM_WIDTH; x += GAP_SIZE) {
          let canPlace = true;
          // Check if the area is free
          for (let i = x; i < x + width; i += GAP_SIZE) {
            for (let j = y; j < y + height; j += GAP_SIZE) {
              if (occupied.has(`${i},${j}`)) {
                canPlace = false;
                break;
              }
            }
            if (!canPlace) break;
          }

          if (canPlace) {
            const score = y + x; // Prioritize top-left placement
            if (score < bestPosition.score) {
              bestPosition = { x, y, score };
            }
          }
        }
      }
      
      const { x: left, y: top } = bestPosition;

      // Mark the area as occupied
      for (let i = left; i < left + width; i += GAP_SIZE) {
        for (let j = top; j < top + height; j += GAP_SIZE) {
          occupied.add(`${i},${j}`);
        }
      }

      positions.push({ item, width, height, top, left, titleFontSize, priceFontSize });

      // Update container dimensions
      finalWidth = Math.max(finalWidth, left + width);
      finalHeight = Math.max(finalHeight, top + height);
    });

    return {
      gridPositions: positions,
      containerWidth: finalWidth,
      containerHeight: finalHeight,
    };
  }, [items, screenWidth]);

  return { gridPositions, containerWidth, containerHeight };
};