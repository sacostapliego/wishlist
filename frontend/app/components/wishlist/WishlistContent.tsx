import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SectionHeader } from '../common/SectionHeader';
import { EmptyState } from '../layout/EmptyState';
import { ItemGrid } from './ItemGrid';
import { SPACING } from '../../styles/theme';

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
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <SectionHeader 
        title="Items" 
        actionIcon={isSelectionMode ? "close-circle" : "add-circle"} 
        onAction={isSelectionMode ? onCancelSelection : onAddItem} 
      />
      
      {!items || items.length === 0 ? (
        <EmptyState 
          message="No items in this wishlist yet" 
          actionText="Add an item"
          onAction={onAddItem}
        />
      ) : (
        <ItemGrid 
          items={items} 
          baseSize={baseSize} 
          onItemPress={onItemPress}
          selectedItems={selectedItems}
          selectionMode={isSelectionMode}
          wishlistColor={wishlistColor}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  content: {
    padding: SPACING.md,
    paddingBottom: 50, // Extra padding at bottom for scrolling
  }
});