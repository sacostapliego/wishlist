import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD_WIDTH, COLORS, SPACING } from '../../styles/theme';

interface WishlistOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSelectItems: () => void;
}

export default function WishlistOptionsMenu({ 
  visible, 
  onClose,
  onDelete,
  onEdit,
  onSelectItems
}: WishlistOptionsMenuProps) {
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={onEdit}
          >
            <Ionicons name="create-outline" size={24} color={COLORS.text.primary} />
            <Text style={styles.menuText}>Edit Wishlist</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={onSelectItems}
          >
            <Ionicons name="checkbox-outline" size={24} color={COLORS.text.primary} />
            <Text style={styles.menuText}>Select Items</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.deleteItem]} 
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#ff4040" />
            <Text style={[styles.menuText, styles.deleteText]}>Delete Wishlist</Text>
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
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    padding: SPACING.md,
    borderColor: 'white',
    borderWidth: 1,
    backgroundColor: COLORS.background,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  menuText: {
    fontSize: 16,
    marginLeft: SPACING.md,
    color: COLORS.text.primary,
  },
  deleteItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
  },
  deleteText: {
    color: '#ff4040',
  },
});