import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@/app/styles/theme';
import { SelectionHeaderProps } from '@/app/types/objects';

export const SelectionHeader = ({ 
  selectedCount, 
  onCancelSelection, 
  onDeleteSelected 
}: SelectionHeaderProps) => {
  return (
    <View style={styles.selectionHeader}>
      <Text style={styles.selectionText}>
        {selectedCount} items selected
      </Text>
      <View style={styles.selectionActions}>
        <TouchableOpacity 
          style={styles.selectionButton} 
          onPress={onCancelSelection}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.selectionButton, styles.deleteButton]} 
          onPress={onDeleteSelected}
          disabled={selectedCount === 0}
        >
          <Ionicons name="trash" size={20} color="#ff4040" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SelectionHeader;

const styles = StyleSheet.create({
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 16,
    },
  selectionText: {
    color: COLORS.text.primary,
    fontSize: 16,
  },
  selectionActions: {
    flexDirection: 'row',
  },
  selectionButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginLeft: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 64, 64, 0.1)',
    borderRadius: 8,
  },
  cancelText: {
    color: COLORS.text.primary,
  },
  deleteText: {
    color: '#ff4040',
    marginLeft: 4,
  },
});