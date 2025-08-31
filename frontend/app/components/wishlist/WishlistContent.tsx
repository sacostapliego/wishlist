import React, { useEffect, useRef, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withDecay } from 'react-native-reanimated';

import { EmptyState } from '../layout/EmptyState';
import BentoGrid from './BentoGrid';
import { COLORS, SPACING } from '../../styles/theme';
import { WishlistContentProps } from '@/app/types/wishlist';
import { useBentoLayout } from '../../hooks/useBentoLayout';

/**
 * EXTRA_SCROLL gives users “air” around the grid.
 * We then center the viewport on the middle of the items (not the padded canvas).
 */
const EXTRA_SCROLL = 160;
const EDGE_PADDING = SPACING.md;

export const WishlistContent = ({
  items,
  isSelectionMode,
  selectedItems,
  onItemPress,
  onAddItem,
  onCancelSelection,
  wishlistColor,
}: WishlistContentProps) => {
  const { containerWidth, containerHeight } = useBentoLayout(items); // underlying grid footprint (without roam padding)
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // ----- WEB SCROLL REFS & SYNC -----
  const mainRef = useRef<ScrollView>(null);
  const bottomRef = useRef<ScrollView>(null);
  const syncingMain = useRef(false);
  const syncingBottom = useRef(false);
  const lastY = useRef(0);

  const onMainScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
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

  const onBottomScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS !== 'web') return;
    const { x } = e.nativeEvent.contentOffset;
    if (syncingMain.current) {
      syncingMain.current = false;
      return;
    }
    syncingBottom.current = true;
    mainRef.current?.scrollTo({ x, y: lastY.current, animated: false });
  };

  // ----- CENTERING STATE (WEB) -----
  /**
   * We must wait for actual ScrollView content size (onContentSizeChange) because
   * image dimension async or layout changes can alter container size after first render.
   */
  const hasCenteredWeb = useRef(false);
  const lastItemSignature = useRef<string>('');

  // Build a signature for reset (length + ids) - lightweight
  const itemSignature = items.map(i => i.id).join('|');

  useEffect(() => {
    if (itemSignature !== lastItemSignature.current) {
      hasCenteredWeb.current = false;
      lastItemSignature.current = itemSignature;
    }
  }, [itemSignature]);

  const centerWebOnce = useCallback(() => {
    if (hasCenteredWeb.current) return;
    if (!containerWidth || !containerHeight) return;

    // Desired offsets: center viewport on actual items (not whole padded canvas)
    const baseX = EDGE_PADDING + EXTRA_SCROLL + (containerWidth - screenWidth) / 2;
    const baseY = EDGE_PADDING + EXTRA_SCROLL + (containerHeight - screenHeight) / 2;

    const targetX = Math.max(0, baseX);
    const targetY = Math.max(0, baseY);

    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({ x: targetX, y: targetY, animated: false });
      bottomRef.current?.scrollTo({ x: targetX, animated: false });
      hasCenteredWeb.current = true;
    });
  }, [containerWidth, containerHeight, screenWidth, screenHeight]);

  const onWebContentSizeChange = (_w: number, _h: number) => {
    if (Platform.OS !== 'web') return;
    centerWebOnce();
  };

  // Also attempt centering if dimensions change later (fallback)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    centerWebOnce();
  }, [centerWebOnce]);

  // ----- MOBILE FREE-PAN (REANIMATED) -----
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Initial mobile centering
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!containerWidth || !containerHeight) return;

    const minX = Math.min(0, screenWidth - (containerWidth + EDGE_PADDING * 2) - EXTRA_SCROLL);
    const minY = Math.min(0, screenHeight - (containerHeight + EDGE_PADDING * 2) - EXTRA_SCROLL);

    const centerX = (screenWidth - containerWidth) / 2;
    const centerY = (screenHeight - containerHeight) / 2;

    translateX.value = Math.min(0, Math.max(minX, centerX));
    translateY.value = Math.min(0, Math.max(minY, centerY));
  }, [containerWidth, containerHeight, screenWidth, screenHeight, translateX, translateY]);

  const onPanGestureEvent = (event: any) => {
    if (Platform.OS === 'web') return;
    const { translationX, translationY, state, velocityX, velocityY } = event.nativeEvent;

    if (state === State.BEGAN) {
      startX.value = translateX.value;
      startY.value = translateY.value;
    } else if (state === State.ACTIVE) {
      translateX.value = startX.value + translationX;
      translateY.value = startY.value + translationY;
    } else if (state === State.END) {
      const minX = Math.min(0, screenWidth - (containerWidth + EDGE_PADDING * 2) - EXTRA_SCROLL);
      const minY = Math.min(0, screenHeight - (containerHeight + EDGE_PADDING * 2) - EXTRA_SCROLL);
      const clampX: [number, number] = [minX, EXTRA_SCROLL];
      const clampY: [number, number] = [minY, EXTRA_SCROLL];

      translateX.value = withDecay({ velocity: velocityX, clamp: clampX });
      translateY.value = withDecay({ velocity: velocityY, clamp: clampY });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    padding: EDGE_PADDING,
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
        <EmptyState
          message="No items in this wishlist yet"
          actionText="Add an item"
          onAction={onAddItem}
        />
      ) : Platform.OS === 'web' ? (
        <View style={styles.webScrollWrap}>
          <ScrollView
            key={itemSignature} // remount on data change ensures fresh centering
            ref={mainRef}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            onScroll={onMainScroll}
            scrollEventThrottle={16}
            onContentSizeChange={onWebContentSizeChange}
            contentContainerStyle={[
              styles.scrollContentContainer,
              {
                padding: EDGE_PADDING + EXTRA_SCROLL,
                minWidth: containerWidth + (EDGE_PADDING + EXTRA_SCROLL) * 2,
                minHeight: containerHeight + (EDGE_PADDING + EXTRA_SCROLL) * 2,
              },
            ]}
          >
            {renderGrid()}
          </ScrollView>

          <ScrollView
            ref={bottomRef}
            horizontal
            showsHorizontalScrollIndicator
            style={styles.bottomScrollbar}
            contentContainerStyle={{
              width: containerWidth + (EDGE_PADDING + EXTRA_SCROLL) * 2,
              height: 1,
            }}
            onScroll={onBottomScroll}
            scrollEventThrottle={16}
          />
        </View>
      ) : (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PanGestureHandler
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanGestureEvent}
          >
            <Animated.View style={[styles.panContainer, animatedStyle]}>
              {renderGrid()}
            </Animated.View>
          </PanGestureHandler>
        </GestureHandlerRootView>
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
    alignItems: 'flex-start',
  },
  bottomScrollbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 14,
    zIndex: 5,
  },
  panContainer: {
    // padding applied via animatedStyle
  },
});

export default WishlistContent;