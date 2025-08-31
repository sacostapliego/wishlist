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

const EXTRA_SCROLL = 160;              // extra roaming space
const EDGE_PADDING = SPACING.md;       // base padding
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

  // Auto-centering gating
  const shouldAutoCenter = useRef(true); // reset on data change or dimension change
  const pendingCenterPasses = useRef<number[]>([]); // timeout IDs

  // Clear any scheduled passes
  const clearCenterPasses = () => {
    pendingCenterPasses.current.forEach(id => clearTimeout(id));
    pendingCenterPasses.current = [];
  };

  const scheduleCenterPasses = useCallback(() => {
    if (Platform.OS !== 'web') return;
    clearCenterPasses();
    // immediate + delayed passes (for images / fonts)
    [0, 40, 160].forEach(delay => {
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

  // React to item changes
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (itemSignature !== lastSignature.current) {
      lastSignature.current = itemSignature;
      shouldAutoCenter.current = true;
      scheduleCenterPasses();
    }
  }, [itemSignature, scheduleCenterPasses]);

  // React to layout dimension changes of grid footprint
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (containerWidth && containerHeight) {
      shouldAutoCenter.current = !userInteracted.current;
      scheduleCenterPasses();
    }
  }, [containerWidth, containerHeight, scheduleCenterPasses]);

  // React to viewport resize
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!userInteracted.current) {
      shouldAutoCenter.current = true;
      scheduleCenterPasses();
    }
  }, [screenWidth, screenHeight, scheduleCenterPasses]);

  // Content size change (fires after images load)
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
      // Programmatic center or sync scroll; ignore as user intent
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

  useEffect(() => () => clearCenterPasses(), []); // cleanup

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
      const totalW = containerWidth + TOTAL_PAD * 2;
      const totalH = containerHeight + TOTAL_PAD * 2;
      const minX = Math.min(0, screenWidth - totalW);
      const minY = Math.min(0, screenHeight - totalH);
      translateX.value = withDecay({ velocity: velocityX, clamp: [minX, TOTAL_PAD] });
      translateY.value = withDecay({ velocity: velocityY, clamp: [minY, TOTAL_PAD] });
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
        <View style={styles.webWrapper}>
          <ScrollView
            key={itemSignature} // remount triggers fresh passes
            ref={mainRef}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            onScroll={onMainScroll}
            scrollEventThrottle={16}
            onContentSizeChange={onWebContentSizeChange}
            contentContainerStyle={{
              padding: TOTAL_PAD,
              minWidth: containerWidth + TOTAL_PAD * 2,
              minHeight: containerHeight + TOTAL_PAD * 2,
              alignItems: 'flex-start',
            }}
          >
            {renderGrid()}
          </ScrollView>

          <ScrollView
            ref={bottomRef}
            horizontal
            showsHorizontalScrollIndicator
            style={styles.bottomScrollbar}
            contentContainerStyle={{
              width: containerWidth + TOTAL_PAD * 2,
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
  actionButton: {
    padding: SPACING.xs,
  },
  webWrapper: {
    flex: 1,
    position: 'relative',
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
    // padding via animatedStyle
  },
});

export default WishlistContent;