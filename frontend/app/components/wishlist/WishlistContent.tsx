import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../layout/EmptyState';
import { ItemGrid } from './ItemGrid';
import { COLORS, SPACING } from '../../styles/theme';

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
  }
});