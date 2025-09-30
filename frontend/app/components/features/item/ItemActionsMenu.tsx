import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import wishlistAPI from '@/app/services/wishlist';
import { COLORS } from '@/app/styles/theme';
import ConfirmDialog from '../modals/Confirm';
import ItemOptionsMenu from './ItemOptionsMenu';
import { useRefresh } from '@/app/context/RefreshContext';
import { ItemActionsMenuProps } from '@/app/types/items';

export const ItemActionsMenu = ({
  itemId,
  wishlistId,
  itemName,
  menuVisible,
  onMenuClose,
  onItemDeleted,
  onError,
}: ItemActionsMenuProps) => {
  const router = useRouter();
  const { triggerRefresh } = useRefresh();
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditItem = () => {
    onMenuClose();
    router.push(`/home/lists/${wishlistId}/${itemId}/edit`); // Define this route for editing items
  };

  const handleDeletePress = () => {
    setConfirmDeleteVisible(true);
  };

  const handleDeleteConfirm = async () => {
    setConfirmDeleteVisible(false);
    setIsDeleting(true);
    try {
      await wishlistAPI.deleteItem(itemId);
      onItemDeleted();
    } catch (error) {
      console.error('Failed to delete item:', error);
      onError?.('Failed to delete item. Please try again.');
    } finally {
      setIsDeleting(false);
      onMenuClose(); // Ensure menu is closed after action
    }
  };

  return (
    <>
      <ItemOptionsMenu
        visible={menuVisible}
        onClose={onMenuClose}
        onEdit={handleEditItem}
        onDelete={handleDeletePress}
      />
      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmDeleteVisible(false);
          // onMenuClose(); // Close menu if cancel on confirm
        }}
        isDestructive={true}
      />
      {isDeleting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </>
  );
};

export default ItemActionsMenu;

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});