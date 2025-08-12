import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withDecay } from 'react-native-reanimated';
import { EmptyState } from '../layout/EmptyState';
import BentoGrid from './BentoGrid';
import { COLORS, SPACING } from '../../styles/theme';
import { WishlistContentProps } from '@/app/types/wishlist';
import { useBentoLayout } from '../../hooks/useBentoLayout';

const EXTRA_SCROLL = 48; // allow scrolling/panning slightly past content

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

  // Web scroll sync refs
  const mainRef = useRef<ScrollView>(null);
  const bottomRef = useRef<ScrollView>(null);
  const syncingMain = useRef(false);
  const syncingBottom = useRef(false);
  const lastY = useRef(0);

  const onMainScroll = (e: any) => {
    if (Platform.OS !== 'web') return;
    const { x, y } = e.nativeEvent.contentOffset;
    lastY.current = y;
    if (syncingBottom.current) {
      syncingBottom.current = false;
      return;
    }
    syncingMain.current = true;
    bottomRef.current?.scrollTo({ x, animated: false });
  };

  const onBottomScroll = (e: any) => {
    if (Platform.OS !== 'web') return;
    const { x } = e.nativeEvent.contentOffset;
    if (syncingMain.current) {
      syncingMain.current = false;
      return;
    }
    syncingBottom.current = true;
    mainRef.current?.scrollTo({ x, y: lastY.current, animated: false });
  };

  // Mobile pan state
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Center grid initially on mobile
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const xMin = Math.min(0, screenWidth - containerWidth - SPACING.md * 2);
    const yMin = Math.min(0, screenHeight - containerHeight - SPACING.md * 2);
    const centerX = (screenWidth - containerWidth) / 2;
    const centerY = (screenHeight - containerHeight) / 2;
    translateX.value = Math.min(0, Math.max(xMin, centerX));
    translateY.value = Math.min(0, Math.max(yMin, centerY));
  }, [containerWidth, containerHeight, screenWidth, screenHeight]);

  const onPanGestureEvent = (event: any) => {
    if (Platform.OS === 'web') return;
    const { translationX, translationY, state, velocityX, velocityY } = event.nativeEvent;

    if (state === State.BEGAN) {
      startX.value = translateX.value;
      startY.value = translateY.value;
    }
    if (state === State.ACTIVE) {
      translateX.value = startX.value + translationX;
      translateY.value = startY.value + translationY;
    }
    if (state === State.END) {
      // NOTE: explicitly type as tuple to satisfy TS
      const clampX: [number, number] = [
        Math.min(0, screenWidth - containerWidth - SPACING.md * 2 - EXTRA_SCROLL),
        0,
      ];
      const clampY: [number, number] = [
        Math.min(0, screenHeight - containerHeight - SPACING.md * 2 - EXTRA_SCROLL),
        0,
      ];
      translateX.value = withDecay({ velocity: velocityX, clamp: clampX });
      translateY.value = withDecay({ velocity: velocityY, clamp: clampY });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
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

  return (
    <View style={styles.container}>
      {isSelectionMode && (
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={onCancelSelection} style={styles.actionButton}>
            <Ionicons name="close-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}

      {!items || items.length === 0 ? (
        <EmptyState message="No items in this wishlist yet" actionText="Add an item" onAction={onAddItem} />
      ) : Platform.OS === 'web' ? (
        <View style={styles.webScrollWrap}>
          <ScrollView
            ref={mainRef}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            onScroll={onMainScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.scrollContentContainer,
              {
                // allow a little extra space past the grid on both axes
                minWidth: containerWidth + EXTRA_SCROLL,
                minHeight: containerHeight + EXTRA_SCROLL,
                paddingBottom: 18,
              },
            ]}
          >
            {renderGrid()}
          </ScrollView>

          {/* Pinned horizontal scrollbar synced with content */}
          <ScrollView
            ref={bottomRef}
            horizontal
            showsHorizontalScrollIndicator={true}
            style={styles.bottomScrollbar}
            contentContainerStyle={{ width: containerWidth + EXTRA_SCROLL, height: 1 }}
            onScroll={onBottomScroll}
            scrollEventThrottle={16}
          />
        </View>
      ) : (
        <PanGestureHandler onGestureEvent={onPanGestureEvent} onHandlerStateChange={onPanGestureEvent}>
          <Animated.View style={[styles.panContainer, animatedStyle]}>
            {renderGrid()}
          </Animated.View>
        </PanGestureHandler>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webScrollWrap: {
    flex: 1,
    position: 'relative',
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
  scrollContentContainer: {
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  bottomScrollbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,          // pinned to bottom
    height: 14,         // thin track; browser renders scrollbar here
    zIndex: 5,
  },
  panContainer: {
    // Animated container; grid itself determines size
  },
});

export default WishlistContent;