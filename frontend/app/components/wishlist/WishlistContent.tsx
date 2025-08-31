import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { EmptyState } from '../layout/EmptyState';
import BentoGrid from './BentoGrid';
import { COLORS, SPACING } from '../../styles/theme';
import { WishlistContentProps } from '@/app/types/wishlist';
import { useBentoLayout } from '../../hooks/useBentoLayout';

const EXTRA_SCROLL = 48;
const SMALL_CONTENT_SLACK = 60;

export const WishlistContent = ({
  items,
  isSelectionMode,
  selectedItems,
  onItemPress,
  onAddItem,
  onCancelSelection,
  wishlistColor,
}: WishlistContentProps) => {
  const { containerWidth, containerHeight } = useBentoLayout(items);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Shared translation
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Compute clamps (allow slack if content smaller)
  const getClamp = useCallback(() => {
    const contentW = containerWidth + SPACING.md * 2;
    const contentH = containerHeight + SPACING.md * 2;
    const horizontalSlack = contentW < screenWidth ? SMALL_CONTENT_SLACK : EXTRA_SCROLL;
    const verticalSlack = contentH < screenHeight ? SMALL_CONTENT_SLACK : EXTRA_SCROLL;

    const minX = Math.min(0, screenWidth - contentW - horizontalSlack);
    const minY = Math.min(0, screenHeight - contentH - verticalSlack);

    const maxX = horizontalSlack > 0 && contentW < screenWidth ? horizontalSlack : 0;
    const maxY = verticalSlack > 0 && contentH < screenHeight ? verticalSlack : 0;

    return {
      x: [minX, maxX] as [number, number],
      y: [minY, maxY] as [number, number],
    };
  }, [screenWidth, screenHeight, containerWidth, containerHeight]);

  // Center initially
  useEffect(() => {
    const contentW = containerWidth;
    const contentH = containerHeight;
    const centerX = (screenWidth - contentW) / 2;
    const centerY = (screenHeight - contentH) / 2;
    translateX.value = centerX > 0 ? 0 : Math.min(0, centerX);
    translateY.value = centerY > 0 ? 0 : Math.min(0, centerY);
  }, [screenWidth, screenHeight, containerWidth, containerHeight, translateX, translateY]);

  const clampInside = useCallback(() => {
    const { x, y } = getClamp();
    translateX.value = Math.min(x[1], Math.max(x[0], translateX.value));
    translateY.value = Math.min(y[1], Math.max(y[0], translateY.value));
  }, [getClamp, translateX, translateY]);

  // Pan gesture (unified)
  const pan = Gesture.Pan()
    .minDistance(1)
    .onBegin(() => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate(e => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd(e => {
      const { x, y } = getClamp();
      translateX.value = withDecay({ velocity: e.velocityX, clamp: x });
      translateY.value = withDecay({ velocity: e.velocityY, clamp: y });
    })
    .onFinalize(() => {
      runOnJS(clampInside)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const renderGrid = () => (
    <BentoGrid
      items={items}
      onItemPress={onItemPress}
      selectedItems={selectedItems}
      selectionMode={isSelectionMode}
      wishlistColor={wishlistColor}
    />
  );

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

  // Web-only pointer behavior
  const webDragStyle =
    Platform.OS === 'web'
      ? ({ cursor: 'grab', touchAction: 'none', WebkitUserSelect: 'none' } as any)
      : null;

  return (
    <View style={[styles.container, Platform.OS === 'web' ? ({ touchAction: 'none' } as any) : null]}>
      {isSelectionMode && (
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={onCancelSelection} style={styles.actionButton}>
            <Ionicons name="close-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}
      <GestureDetector gesture={pan}>
        <Animated.View
          id="wishlist-pan-surface"
          style={[styles.panSurface, webDragStyle, animatedStyle]}
        >
          <View
            style={{
              width: containerWidth,
              height: containerHeight,
              padding: SPACING.md,
            }}
          >
            {renderGrid()}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create<{
  container: ViewStyle;
  headerContainer: ViewStyle;
  actionButton: ViewStyle;
  panSurface: ViewStyle;
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
  panSurface: {
    flex: 1,
    minWidth: '100%',
    minHeight: '100%',
  },
});

export default WishlistContent;