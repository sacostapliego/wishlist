import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';
import { EmptyState } from '../layout/EmptyState';
import { WishlistContentProps } from '@/app/types/wishlist';
import { useBentoLayout } from '../../hooks/useBentoLayout';
import BentoGrid from './BentoGrid';
import { PanCanvas } from '../common/PanCanvas';

export const WishlistContent = ({
  items,
  isSelectionMode,
  selectedItems,
  onItemPress,
  onAddItem,
  onCancelSelection,
  wishlistColor,
}: WishlistContentProps) => {
  const {
    gridPositions,
    containerWidth,
    containerHeight,
  } = useBentoLayout(items);

  if (!items || items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          message="No items in this wishlist yet"
          actionText="Add an item"
          onAction={onAddItem}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'web' ? ({ touchAction: 'none' } as any) : null,
      ]}
    >
      {isSelectionMode && (
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={onCancelSelection} style={styles.actionButton}>
            <Ionicons name="close-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}

      <PanCanvas
        width={containerWidth}
        height={containerHeight}
        overscroll={48}
        webUseNativeScroll={false} // flip to true if you prefer standard scroll on web
      >
        {() => (
          <BentoGrid
            gridPositions={gridPositions}
            width={containerWidth}
            height={containerHeight}
            items={items}
            onItemPress={onItemPress}
            selectedItems={selectedItems}
            selectionMode={isSelectionMode}
            wishlistColor={wishlistColor}
          />
        )}
      </PanCanvas>
    </View>
  );
};

const styles = StyleSheet.create<{
  container: ViewStyle;
  headerContainer: ViewStyle;
  actionButton: ViewStyle;
}>({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  actionButton: {
    padding: SPACING.xs,
  },
});

export default WishlistContent;