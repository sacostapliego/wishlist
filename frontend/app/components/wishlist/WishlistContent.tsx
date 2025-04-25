import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../layout/EmptyState';
import { ItemGrid } from './ItemGrid';
import { COLORS, SPACING } from '../../styles/theme';
import BentoGrid, { getBentoGridWidth } from './BentoGrid';

interface WishlistItem {
  id: string;
  name: string;
  image?: string;
  price?: number;
  priority: number;
}

interface WishlistContentProps {
  items: WishlistItem[];
  baseSize: number;
  isSelectionMode: boolean;
  selectedItems: string[];
  onItemPress: (item: WishlistItem) => void;
  onAddItem: () => void;
  onCancelSelection: () => void;
  wishlistColor?: string;
}

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
  
  // Effect to scroll to the middle when items are loaded
  useEffect(() => {
    if (items.length > 0 && scrollViewRef.current) {
      const containerWidth = getBentoGridWidth();
      const viewportWidth = Platform.OS === 'web' ? 
        430 :
        Dimensions.get('window').width;
      
      const scrollToOffset = (containerWidth - viewportWidth) / 2;
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ 
          x: scrollToOffset, 
          y: 0, 
          animated: false 
        });
      }, 100);
    }
  }, [items]);
  
  const getGridContentHeight = () => {
    return Platform.OS === 'web' 
      ? Dimensions.get('window').height * 1
      : Dimensions.get('window').height * 1.8;
  };

  return (
    <View style={styles.container}>
      {/* Only show cancel button when in selection mode */}
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
          ref={scrollViewRef}
          horizontal={true}
          showsHorizontalScrollIndicator={true}
          nestedScrollEnabled={true}
            contentContainerStyle={[styles.horizontalScrollContent, {
              height: getGridContentHeight()
            }]}
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
      )}
    </View>
  );
};

export default WishlistContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 50, // Extra padding at bottom for scrolling
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: SPACING.md,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    minHeight: Dimensions.get('window').height * 0.5,
  },
  horizontalScrollContent: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    minHeight: Dimensions.get('window').height * 0.8,
  }
});