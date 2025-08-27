import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD_WIDTH, COLORS, SPACING } from '../../styles/theme';
import { ItemOptionsMenuProps } from '@/app/types/items';

export default function ItemOptionsMenu({
  visible,
  onClose,
  onEdit,
  onDelete,
}: ItemOptionsMenuProps) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
            <Ionicons name="create-outline" size={24} color={COLORS.text.primary} />
            <Text style={styles.menuText}>Edit Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.deleteItem]}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
            <Text style={[styles.menuText, styles.deleteText]}>Delete Item</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: CARD_WIDTH * 0.9, // Slightly smaller or adjust as needed
    borderRadius: 12,
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuText: {
    fontSize: 16,
    marginLeft: SPACING.md,
    color: COLORS.text.primary,
  },
  deleteItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
  },
  deleteText: {
    color: COLORS.error,
  },
});