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
  GestureHandlerRootView,
  PanGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
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

  // Compute clamps
  const getClamp = useCallback(() => {
    const minX = Math.min(
      0,
      screenWidth - containerWidth - SPACING.md * 2 - EXTRA_SCROLL
    );
    const minY = Math.min(
      0,
      screenHeight - containerHeight - SPACING.md * 2 - EXTRA_SCROLL
    );
    return {
      x: [minX, 0] as [number, number],
      y: [minY, 0] as [number, number],
    };
  }, [screenWidth, screenHeight, containerWidth, containerHeight]);

  // Center initially
  useEffect(() => {
    const minX = Math.min(
      0,
      screenWidth - containerWidth - SPACING.md * 2
    );
    const minY = Math.min(
      0,
      screenHeight - containerHeight - SPACING.md * 2
    );
    const centerX = (screenWidth - containerWidth) / 2;
    const centerY = (screenHeight - containerHeight) / 2;
    translateX.value = Math.min(0, Math.max(minX, centerX));
    translateY.value = Math.min(0, Math.max(minY, centerY));
  }, [screenWidth, screenHeight, containerWidth, containerHeight, translateX, translateY]);

  const clampInside = useCallback(() => {
    const { x, y } = getClamp();
    translateX.value = Math.min(x[1], Math.max(x[0], translateX.value));
    translateY.value = Math.min(y[1], Math.max(y[0], translateY.value));
  }, [getClamp, translateX, translateY]);

  // Gesture event (continuous movement)
  const onPanGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = event.nativeEvent;
    translateX.value = startX.value + translationX;
    translateY.value = startY.value + translationY;
  };

  // State changes (start / end)
  const onPanStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, velocityX, velocityY } = event.nativeEvent;

    if (state === State.BEGAN) {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      startX.value = translateX.value;
      startY.value = translateY.value;
    } else if (state === State.END || state === State.CANCELLED) {
      const { x, y } = getClamp();
      translateX.value = withDecay({ velocity: velocityX, clamp: x });
      translateY.value = withDecay({ velocity: velocityY, clamp: y });
    }
  };

  // Wheel support (web only)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = document.getElementById('wishlist-pan-surface');
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      const factor = e.deltaMode === 1 ? 16 : 1;
      translateX.value -= e.deltaX * factor;
      translateY.value -= e.deltaY * factor;
      runOnJS(clampInside)();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clampInside, translateX, translateY]);

  // Arrow keys (web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const step = 60;
      let used = true;
      switch (e.key) {
        case 'ArrowLeft':
          translateX.value += step;
          break;
        case 'ArrowRight':
          translateX.value -= step;
          break;
        case 'ArrowUp':
          translateY.value += step;
          break;
        case 'ArrowDown':
          translateY.value -= step;
          break;
        default:
          used = false;
      }
      if (used) {
        e.preventDefault();
        clampInside();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clampInside, translateX, translateY]);

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

  // Web-only cursor + touchAction (kept out of StyleSheet to avoid type widening)
  const panSurfaceWebStyle =
    Platform.OS === 'web'
      ? ({ cursor: 'grab', touchAction: 'none' } as any)
      : null;

  return (
    <View style={styles.container}>
      {isSelectionMode && (
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={onCancelSelection}
            style={styles.actionButton}
          >
            <Ionicons
              name="close-circle"
              size={28}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      )}

      <GestureHandlerRootView style={styles.gestureRoot}>
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanStateChange}
        >
          <Animated.View
            id="wishlist-pan-surface"
            style={[styles.panSurface, panSurfaceWebStyle, animatedStyle]}
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
        </PanGestureHandler>
      </GestureHandlerRootView>
    </View>
  );
};

const styles = StyleSheet.create<{
  container: ViewStyle;
  headerContainer: ViewStyle;
  actionButton: ViewStyle;
  gestureRoot: ViewStyle;
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
  gestureRoot: {
    flex: 1,
  },
  panSurface: {
    flex: 1,
    minWidth: '100%',
    minHeight: '100%',
  },
});

export default WishlistContent;