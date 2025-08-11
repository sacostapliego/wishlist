import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withDecay, runOnJS } from 'react-native-reanimated';
import { EmptyState } from '../layout/EmptyState';
import BentoGrid from './BentoGrid';
import { COLORS, SPACING } from '../../styles/theme';
import { WishlistContentProps } from '@/app/types/wishlist';
import { useBentoLayout } from '../../hooks/useBentoLayout';

export const WishlistContent = ({
  items,
  isSelectionMode,
  selectedItems,
  onItemPress,
  onAddItem,
  onCancelSelection,
  wishlistColor,
}: WishlistContentProps) => {
  const { gridPositions, containerWidth, containerHeight } = useBentoLayout(items);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

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
      // Calculate clamping boundaries
      const clampX: [number, number] = [Math.min(0, screenWidth - containerWidth - SPACING.md * 2), 0];
      const clampY: [number, number] = [Math.min(0, screenHeight - containerHeight - SPACING.md * 2), 0];

      translateX.value = withDecay({ velocity: velocityX, clamp: clampX });
      translateY.value = withDecay({ velocity: velocityY, clamp: clampY });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

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
        <ScrollView
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {renderGrid()}
        </ScrollView>
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
    overflow: 'hidden', // Important for pan gesture
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
    alignItems: 'flex-start', // Align grid to the top
  },
  panContainer: {
    // The pan container itself doesn't need explicit dimensions
    // as the animated view will wrap the grid.
  },
});

export default WishlistContent;