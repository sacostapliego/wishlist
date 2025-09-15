import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../styles/theme';

export type SortOption = 'none' | 'price-high' | 'price-low' | 'priority-high';

interface WishlistFiltersProps {
  sortBy: SortOption;
  onSortChange: (sortOption: SortOption) => void;
  wishlistColor?: string;
}

export const WishlistFilters: React.FC<WishlistFiltersProps> = ({
  sortBy,
  onSortChange,
  wishlistColor,
}) => {
  const handleSortPress = (option: SortOption) => {
    onSortChange(sortBy === option ? 'none' : option);
  };

  const activeColor = wishlistColor || COLORS.primary;

  return (
    <View style={styles.sortContainer}>
      <View style={styles.sortButtonsContainer}>
        {/* Price High */}
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'price-high' && styles.activeSortButton]}
          onPress={() => handleSortPress('price-high')}
        >
          <Text style={[styles.sortSymbol, sortBy === 'price-high' && { color: activeColor }]}>$</Text>
          <Ionicons
            name="arrow-up"
            size={16}
            color={sortBy === 'price-high' ? activeColor : COLORS.border}
          />
        </TouchableOpacity>

        {/* Price Low */}
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'price-low' && styles.activeSortButton]}
          onPress={() => handleSortPress('price-low')}
        >
          <Text style={[styles.sortSymbol, sortBy === 'price-low' && { color: activeColor }]}>$</Text>
          <Ionicons
            name="arrow-down"
            size={16}
            color={sortBy === 'price-low' ? activeColor : COLORS.border}
          />
        </TouchableOpacity>

        {/* Priority High */}
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'priority-high' && styles.activeSortButton]}
          onPress={() => handleSortPress('priority-high')}
        >
          <Text style={[styles.sortSymbol, sortBy === 'priority-high' && { color: activeColor }]}>!</Text>
          <Ionicons
            name="arrow-up"
            size={16}
            color={sortBy === 'priority-high' ? activeColor : COLORS.border}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sortContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopColor: COLORS.border,
    borderBottomColor: COLORS.border,
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeSortButton: {
  },
  sortSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.border,
    marginRight: 2,
  },
  activeSortSymbol: {
  },
});