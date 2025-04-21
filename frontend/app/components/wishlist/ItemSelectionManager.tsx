import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { wishlistAPI } from '../../services/wishlist';
import { COLORS } from '../../styles/theme';
import Toast from 'react-native-toast-message';
import ConfirmDialog from '../modals/Confirm';
import { useRefresh } from '../../context/RefreshContext';

interface ItemSelectionManagerProps {
  selectedItems: string[];
  onItemsDeleted: () => void;
  refetchItems: () => void;
  confirmDeleteVisible: boolean;
  setConfirmDeleteVisible: (visible: boolean) => void;
}

export const ItemSelectionManager = ({
  selectedItems,
  onItemsDeleted,
  refetchItems,
  confirmDeleteVisible,
  setConfirmDeleteVisible
}: ItemSelectionManagerProps) => {
  const { triggerRefresh } = useRefresh();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSelectedItems = async () => {
    setConfirmDeleteVisible(false);
    setIsDeleting(true);
    
    try {
      // Delete each selected item
      for (const itemId of selectedItems) {
        await wishlistAPI.deleteItem(itemId);
      }
      
      triggerRefresh();
      refetchItems();
      onItemsDeleted();
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `${selectedItems.length} items deleted`
      });
    } catch (error) {
      console.error('Failed to delete items:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete some items'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selectedItems.length} items? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteSelectedItems}
        onCancel={() => setConfirmDeleteVisible(false)}
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

export default ItemSelectionManager;

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});