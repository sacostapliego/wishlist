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
import Animated, { useSharedValue, useAnimatedStyle, withDecay, useAnimatedScrollHandler } from 'react-native-reanimated';

import { EmptyState } from '../layout/EmptyState';
import BentoGrid from './BentoGrid';
import { COLORS, SPACING } from '../../styles/theme';
import { WishlistContentProps } from '@/app/types/wishlist';
import { useBentoLayout } from '../../hooks/useBentoLayout';

const EXTRA_SCROLL = 160;
const EDGE_PADDING = SPACING.md;
const TOTAL_PAD = EDGE_PADDING + EXTRA_SCROLL;

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

  // ---------- WEB SCROLL + CUSTOM HORIZONTAL BAR ----------
  const mainRef = useRef<ScrollView>(null);
  const bottomRef = useRef<ScrollView>(null);

  const syncingMain = useRef(false);
  const syncingBottom = useRef(false);

  const programmaticScroll = useRef(false);
  const userInteracted = useRef(false);

  const lastY = useRef(0);

  const itemSignature = items.map(i => i.id).join('|');
  const lastSignature = useRef(itemSignature);

  const shouldAutoCenter = useRef(true);
  const pendingCenterPasses = useRef<number[]>([]);

  const clearCenterPasses = () => {
    pendingCenterPasses.current.forEach(id => clearTimeout(id));
    pendingCenterPasses.current = [];
  };

  // Extra passes (added 400ms)
  const scheduleCenterPasses = useCallback(() => {
    if (Platform.OS !== 'web') return;
    clearCenterPasses();
    [0, 40, 160, 400].forEach(delay => {
      const id = setTimeout(() => centerToContent(), delay) as unknown as number;
      pendingCenterPasses.current.push(id);
    });
  }, []);

  const centerToContent = useCallback(() => {
    if (Platform.OS !== 'web') return;
    if (!shouldAutoCenter.current) return;
    if (!containerWidth || !containerHeight) return;

    const totalW = containerWidth + TOTAL_PAD * 2;
    const totalH = containerHeight + TOTAL_PAD * 2;

    const targetX = Math.max(0, (totalW - screenWidth) / 2);
    const targetY = Math.max(0, (totalH - screenHeight) / 2);

    programmaticScroll.current = true;
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({ x: targetX, y: targetY, animated: false });
      bottomRef.current?.scrollTo({ x: targetX, animated: false });
    });
  }, [containerWidth, containerHeight, screenWidth, screenHeight]);

  // Item changes
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (itemSignature !== lastSignature.current) {
      lastSignature.current = itemSignature;
      shouldAutoCenter.current = true;
      scheduleCenterPasses();
    }
  }, [itemSignature, scheduleCenterPasses]);

  // Footprint changes
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (containerWidth && containerHeight) {
      shouldAutoCenter.current = !userInteracted.current;
      scheduleCenterPasses();
    }
  }, [containerWidth, containerHeight, scheduleCenterPasses]);

  // Viewport resize
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!userInteracted.current) {
      shouldAutoCenter.current = true;
      scheduleCenterPasses();
    }
  }, [screenWidth, screenHeight, scheduleCenterPasses]);

  const onWebContentSizeChange = () => {
    if (Platform.OS !== 'web') return;
    if (!userInteracted.current) {
      shouldAutoCenter.current = true;
      scheduleCenterPasses();
    }
  };

  const onMainScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS !== 'web') return;
    const { x, y } = e.nativeEvent.contentOffset;
    lastY.current = y;

    if (syncingBottom.current) {
      syncingBottom.current = false;
      return;
    }
    if (programmaticScroll.current) {
      programmaticScroll.current = false;
    } else {
      userInteracted.current = true;
      shouldAutoCenter.current = false;
      clearCenterPasses();
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
    programmaticScroll.current = true;
    mainRef.current?.scrollTo({ x, y: lastY.current, animated: false });
  };

  useEffect(() => () => clearCenterPasses(), []);

  // Mark user interaction immediately on touch (prevents later recenter)
  const onAnyTouch = () => {
    if (Platform.OS === 'web') {
      userInteracted.current = true;
      shouldAutoCenter.current = false;
      clearCenterPasses();
    }
  };

  // ---------- MOBILE FREE-PAN ----------
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!containerWidth || !containerHeight) return;

    const totalW = containerWidth + TOTAL_PAD * 2;
    const totalH = containerHeight + TOTAL_PAD * 2;

    const centerX = (screenWidth - totalW) / 2;
    const centerY = (screenHeight - totalH) / 2;

    const minX = Math.min(0, screenWidth - totalW);
    const minY = Math.min(0, screenHeight - totalH);

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
      // Skip inertial if essentially a tap (prevents jump on iOS)
      if (
        Math.abs(translationX) < 3 &&
        Math.abs(translationY) < 3 &&
        Math.abs(velocityX) < 15 &&
        Math.abs(velocityY) < 15
      ) {
        return;
      }
      const totalW = containerWidth + TOTAL_PAD * 2;
      const totalH = containerHeight + TOTAL_PAD * 2;
      const minX = Math.min(0, screenWidth - totalW);
      const minY = Math.min(0, screenHeight - totalH);
      // Limit roaming to 0 on right/bottom (removes jump-left artifacts)
      translateX.value = withDecay({ velocity: velocityX, clamp: [minX, 0] });
      translateY.value = withDecay({ velocity: velocityY, clamp: [minY, 0] });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    padding: TOTAL_PAD,
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

  // Offsets to center if content smaller than viewport (avoid left bias)
  const horizontalCenterPad =
    Platform.OS === 'web' && containerWidth
      ? Math.max(0, (screenWidth - (containerWidth + TOTAL_PAD * 2)) / 2)
      : 0;
  const verticalCenterPad =
    Platform.OS === 'web' && containerHeight
      ? Math.max(0, (screenHeight - (containerHeight + TOTAL_PAD * 2)) / 2)
      : 0;

  return (
    <View style={styles.container}>
      {isSelectionMode && (
        <View style={styles.selectionHeader}>
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
        <View style={styles.webWrapper} onPointerDown={onAnyTouch}>
          <ScrollView
            ref={mainRef}
            style={styles.scrollViewWebFix}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            onScroll={onMainScroll}
            scrollEventThrottle={16}
            onContentSizeChange={onWebContentSizeChange}
            contentContainerStyle={{
              paddingTop: TOTAL_PAD + verticalCenterPad,
              paddingBottom: TOTAL_PAD + verticalCenterPad,
              paddingLeft: TOTAL_PAD + horizontalCenterPad,
              paddingRight: TOTAL_PAD + horizontalCenterPad,
              // SAFETY: avoid NaN if width/height are not ready yet
              minWidth: (containerWidth ?? 0) + TOTAL_PAD * 2,
              minHeight: (containerHeight ?? 0) + TOTAL_PAD * 2,
              alignItems: 'flex-start',
            }}
          >
            {renderGrid()}
          </ScrollView>

          <ScrollView
            ref={bottomRef}
            horizontal
            style={[styles.bottomScrollbar, styles.scrollViewWebFix]}
            showsHorizontalScrollIndicator
            contentContainerStyle={{
              width: (containerWidth ?? 0) + TOTAL_PAD * 2 + (horizontalCenterPad ?? 0) * 2,
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
  container: { flex: 1, overflow: 'hidden' },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  actionButton: { padding: SPACING.xs },
  webWrapper: { 
    flex: 1, 
    position: 'relative',
    touchAction: 'manipulation',
  },
  scrollViewWebFix: {
    touchAction: 'pan-x pan-y',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
  } as any,
  bottomScrollbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 14,
    zIndex: 5,
    touchAction: 'pan-x pan-y',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
  } as any,
  panContainer: {},
});

export default WishlistContent;