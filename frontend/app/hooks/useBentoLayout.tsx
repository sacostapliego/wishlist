import { useMemo } from 'react';
import { Dimensions, Platform } from 'react-native';
import { SPACING } from '../styles/theme';

const WEB_FRAME_WIDTH = 900;

type WishlistItem = {
  id: string;
  name: string;
  image?: string;
  price?: number;
  priority: number;
};

export type BentoGridPosition = {
  item: WishlistItem;
  width: number;
  height: number;
  top: number;
  left: number;
  isCenter?: boolean;
  titleFontSize: number;
  priceFontSize: number;
};

const calculateBentoGridHeight = () => {
  if (Platform.OS === 'web') {
    return Dimensions.get('window').height * 1.5;
  }
  return Dimensions.get('window').height * 1.2;
};

const getGridWidth = () => {
  if (Platform.OS === 'web') {
    return WEB_FRAME_WIDTH * 1.2;
  }
  return Dimensions.get('window').width * 3;
};

const getGridHeight = () => {
  return calculateBentoGridHeight();
};

export const useBentoLayout = (items: WishlistItem[], baseSize: number) => {
  const getSizeMultiplier = (priority: number) => {
    switch (priority) {
      case 0: return Platform.OS === 'web' ? 0.75 : 0.66;
      case 1: return Platform.OS === 'web' ? 0.85 : 0.68;
      case 2: return Platform.OS === 'web' ? 0.95 : 0.70;
      case 3: return Platform.OS === 'web' ? 1 : 0.72;
      case 4: return Platform.OS === 'web' ? 1.1 : 0.74;
      default: return 1;
    }
  };

  const getItemSize = (priority: number) => {
    return baseSize * getSizeMultiplier(priority);
  };

  const getFontSizeInternal = (priority: number, isTitle = true) => {
    const baseFontSize = isTitle ? (Platform.OS === 'web' ? 16 : 14) : (Platform.OS === 'web' ? 14 : 12);
    let fontMultiplier = getSizeMultiplier(priority);
    if (Platform.OS !== 'web') {
      fontMultiplier = 1 + (fontMultiplier - 1) * 0.5;
    }
    return Math.max(10, baseFontSize * fontMultiplier);
  };

  const positionItems = useMemo((): BentoGridPosition[] => {
    const gridWidth = getGridWidth();
    const gridHeight = getGridHeight();
    const sortedItems = [...items].sort((a, b) => b.priority - a.priority);
    const centerX = gridWidth / 2;
    const centerY = gridHeight / (Platform.OS === 'web' ? 2.8 : 2.6);
    const gapSize = SPACING.md;
    let positions: BentoGridPosition[] = [];
    let currentIndex = 0;

    if (sortedItems.length === 0) return [];

    // First item (center)
    if (currentIndex < sortedItems.length) {
      const item = sortedItems[currentIndex];
      const centerItemSize = getItemSize(item.priority);
      console.log(`Centering item ${item.name}: centerX=${centerX}, calculated left=${centerX - centerItemSize / 2}, itemSize=${centerItemSize}, gridWidth=${gridWidth}`); // DEBUG LOG
      positions.push({
        item,
        width: centerItemSize,
        height: centerItemSize,
        top: centerY - centerItemSize / 2,
        left: centerX - centerItemSize / 2,
        isCenter: true,
        titleFontSize: getFontSizeInternal(item.priority, true),
        priceFontSize: getFontSizeInternal(item.priority, false),
      });
      currentIndex++;
    }

    const centerItemActualSize = positions.length > 0 ? positions[0].width : getItemSize(0);

    // Left item
    if (currentIndex < sortedItems.length) {
      const item = sortedItems[currentIndex];
      const itemSize = getItemSize(item.priority);
      positions.push({
        item,
        width: itemSize,
        height: itemSize,
        top: centerY - itemSize / 2,
        left: centerX - centerItemActualSize / 2 - gapSize - itemSize,
        titleFontSize: getFontSizeInternal(item.priority, true),
        priceFontSize: getFontSizeInternal(item.priority, false),
      });
      currentIndex++;
    }

    // Right item
    if (currentIndex < sortedItems.length) {
      const item = sortedItems[currentIndex];
      const itemSize = getItemSize(item.priority);
      positions.push({
        item,
        width: itemSize,
        height: itemSize,
        top: centerY - itemSize / 2,
        left: centerX + centerItemActualSize / 2 + gapSize,
        titleFontSize: getFontSizeInternal(item.priority, true),
        priceFontSize: getFontSizeInternal(item.priority, false),
      });
      currentIndex++;
    }

    // Top item
    if (currentIndex < sortedItems.length) {
      const item = sortedItems[currentIndex];
      const itemSize = getItemSize(item.priority);
      positions.push({
        item,
        width: itemSize,
        height: itemSize,
        top: centerY - centerItemActualSize / 2 - gapSize - itemSize,
        left: centerX - itemSize / 2,
        titleFontSize: getFontSizeInternal(item.priority, true),
        priceFontSize: getFontSizeInternal(item.priority, false),
      });
      currentIndex++;
    }

    // Bottom item
    if (currentIndex < sortedItems.length) {
      const item = sortedItems[currentIndex];
      const itemSize = getItemSize(item.priority);
      positions.push({
        item,
        width: itemSize,
        height: itemSize,
        top: centerY + centerItemActualSize / 2 + gapSize,
        left: centerX - itemSize / 2,
        titleFontSize: getFontSizeInternal(item.priority, true),
        priceFontSize: getFontSizeInternal(item.priority, false),
      });
      currentIndex++;
    }
    
    // Bottom left
    if (currentIndex < sortedItems.length) {
        const item = sortedItems[currentIndex];
        const itemSize = getItemSize(item.priority);
        // Ensure positions[1] (left item) exists before trying to access its properties
        const leftNeighbor = positions.find(p => 
            p.left < centerX - centerItemActualSize / 2 && 
            p.top > centerY - centerItemActualSize && 
            p.top < centerY + centerItemActualSize
        );
        const leftPos = leftNeighbor ? leftNeighbor.left : (centerX - centerItemActualSize / 2 - gapSize - itemSize);
        positions.push({ 
            item, 
            width: itemSize, height: itemSize, 
            top: centerY + centerItemActualSize / 2 + gapSize, 
            left: leftPos,
            titleFontSize: getFontSizeInternal(item.priority, true),
            priceFontSize: getFontSizeInternal(item.priority, false),
        });
        currentIndex++;
    }
    
    // Bottom right
    if (currentIndex < sortedItems.length) {
        const item = sortedItems[currentIndex];
        const itemSize = getItemSize(item.priority);
        // Ensure positions[2] (right item) exists
        const rightNeighbor = positions.find(p => 
            p.left > centerX + centerItemActualSize / 2 && 
            p.top > centerY - centerItemActualSize && 
            p.top < centerY + centerItemActualSize
        );
        const rightPos = rightNeighbor ? rightNeighbor.left + rightNeighbor.width + gapSize : (centerX + centerItemActualSize / 2 + gapSize);
        positions.push({ 
            item, 
            width: itemSize, height: itemSize, 
            top: centerY + centerItemActualSize / 2 + gapSize, 
            left: rightPos,
            titleFontSize: getFontSizeInternal(item.priority, true),
            priceFontSize: getFontSizeInternal(item.priority, false),
        });
        currentIndex++;
    }

    const rowItemsCount = Platform.OS === 'web' ? 4 : 3;
    let highestPrioritySoFar = 0;
    if (sortedItems.length > 0 && positions[0]) { // Check if center item exists
        highestPrioritySoFar = positions[0].item.priority;
    }
    
    // Adjust rowStartTop based on the bottom-most item of the initial cluster
    let currentMaxBottom = centerY; // Default to centerY
    if (positions.length > 0) {
        currentMaxBottom = Math.max(...positions.map(p => p.top + p.height));
    }
    let rowStartTop = currentMaxBottom + gapSize;


    while (currentIndex < sortedItems.length) {
      const itemsInThisRow = Math.min(rowItemsCount, sortedItems.length - currentIndex);
      const rowItemData = [];
      let totalRowWidth = 0;
      let maxItemHeightInThisRow = 0;

      for (let i = 0; i < itemsInThisRow; i++) {
        const item = sortedItems[currentIndex + i];
        const itemSize = getItemSize(item.priority);
        rowItemData.push({ item, size: itemSize });
        totalRowWidth += itemSize;
        if (itemSize > maxItemHeightInThisRow) {
          maxItemHeightInThisRow = itemSize;
        }
      }
      totalRowWidth += (itemsInThisRow - 1) * gapSize;
      let currentLeft = centerX - totalRowWidth / 2;

      for (let i = 0; i < itemsInThisRow; i++) {
        const { item, size } = rowItemData[i];
        positions.push({
          item,
          width: size,
          height: size,
          top: rowStartTop,
          left: currentLeft,
          titleFontSize: getFontSizeInternal(item.priority, true),
          priceFontSize: getFontSizeInternal(item.priority, false),
        });
        currentLeft += size + gapSize;
      }
      currentIndex += itemsInThisRow;
      rowStartTop += maxItemHeightInThisRow + gapSize;
    }
    return positions;
  }, [items, baseSize]); // Dependencies for useMemo

  const containerWidth = getGridWidth();
  const containerHeight = getGridHeight();

  return { gridPositions: positionItems, containerWidth, containerHeight };
};

// Export these for WishlistContent.tsx or other components if needed
export const getBentoGridWidthExport = getGridWidth;
export const getBentoGridRenderedHeightExport = getGridHeight;