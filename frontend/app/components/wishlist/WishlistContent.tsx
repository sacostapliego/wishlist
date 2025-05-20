import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../layout/EmptyState';
import { ItemGrid } from './ItemGrid'; 
import { COLORS, SPACING } from '../../styles/theme';
import BentoGrid, { getBentoGridWidth, getBentoGridRenderedHeight } from './BentoGrid';
import { WishlistContentProps } from '@/app/types/wishlist';

export const WishlistContent = ({
  items,
  baseSize,
  isSelectionMode,
  selectedItems,
  onItemPress,
  onAddItem,
  onCancelSelection,
  wishlistColor,
}: WishlistContentProps) => {

  const scrollViewRef = useRef<ScrollView>(null);
  const verticalScrollViewRef = useRef<ScrollView>(null); // Ref for the inner vertical ScrollView
  
  // Effect to scroll to the middle when items are loaded
  useEffect(() => {
    if (items && items.length > 0 && scrollViewRef.current && verticalScrollViewRef.current) {
      // Horizontal centering
      const bentoContainerWidth = getBentoGridWidth(); // Actual width of the BentoGrid
      const horizontalViewportWidth = Platform.OS === 'web' ? 
        430 : // Assuming DeviceFrame width for web, or a fixed width for the viewport
        Dimensions.get('window').width;
      
      const horizontalScrollToOffset = (bentoContainerWidth - horizontalViewportWidth) / 2;
      
      // Vertical centering
      const bentoGridActualRenderedHeight = getBentoGridRenderedHeight() ;
      const verticalScrollViewportHeight = getGridContentHeight(); 

      let verticalScrollToOffset = (bentoGridActualRenderedHeight - verticalScrollViewportHeight) / 2;
      verticalScrollToOffset = Math.max(0, verticalScrollToOffset);

      setTimeout(() => {
        // Horizontal scroll
        scrollViewRef.current?.scrollTo({ 
          x: horizontalScrollToOffset > 0 ? horizontalScrollToOffset : 0, 
          y: 0, 
          animated: false 
        });

        // Vertical scroll for the inner ScrollView
        verticalScrollViewRef.current?.scrollTo({
          x: 0,
          y: verticalScrollToOffset,
          animated: false
        });
      }, 150); // Increased timeout slightly to ensure layout is fully settled
    } else if (items && items.length === 0 && scrollViewRef.current && verticalScrollViewRef.current) {
      // If no items, scroll to top/left
       setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
        verticalScrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      }, 100);
    }
  }, [items]);
  
  // This defines the height of the viewport for the vertical scroll
  const getGridContentHeight = () => {
    // This should be the height of the ScrollView that contains the BentoGrid vertically
    if (Platform.OS === 'web') {
        return Dimensions.get('window').height;
    }
    // For native, it might be a larger portion or a calculated value based on other elements
    return Dimensions.get('window').height * 0.8;
  };

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
      ) : (
        <ScrollView 
          ref={scrollViewRef} // Ref for horizontal scroll
          horizontal={true}
          showsHorizontalScrollIndicator={true} // Keep true for web/debugging
          nestedScrollEnabled={true}
          contentContainerStyle={[styles.horizontalScrollContent, {
              height: getGridContentHeight() 
          }]}
          style={styles.horizontalScrollView} // Added for potential outer styling
        >
          <ScrollView 
            ref={verticalScrollViewRef}
            nestedScrollEnabled={true} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.verticalScrollContent} 
          >
            <BentoGrid 
              items={items} 
              baseSize={baseSize} 
              onItemPress={onItemPress}
              selectedItems={selectedItems}
              selectionMode={isSelectionMode}
              wishlistColor={wishlistColor}
            />
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
};

export default WishlistContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md, // Add padding if needed
    paddingTop: SPACING.sm,      // Add padding if needed
  },
  actionButton: {
    padding: SPACING.xs,
  },
  horizontalScrollView: {
    flex: 1, // Ensure it takes available space
  },
  horizontalScrollContent: {
    paddingVertical: SPACING.xs, // Reduced padding if BentoGrid has its own
    paddingHorizontal: SPACING.xs,
  },
  verticalScrollContent: {
    paddingBottom: SPACING.lg, // Ensure space at the bottom for scrolling
  }
});