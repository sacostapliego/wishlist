import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { wishlistAPI } from '../../services/wishlist';
import { COLORS } from '../../styles/theme';
import Toast from 'react-native-toast-message';
import WishlistOptionsMenu from '../modals/WishlistOptionsMenu';
import ConfirmDialog from '../modals/Confirm';
import { useRouter } from 'expo-router';
import { useRefresh } from '../../context/RefreshContext';

interface WishlistActionsProps {
  wishlistId: string;
  menuVisible: boolean;
  onMenuClose: () => void;
  onEnterSelectionMode: () => void;
  refetchItems: () => void;
}

export const WishlistActions = ({
  wishlistId,
  menuVisible,
  onMenuClose,
  onEnterSelectionMode,
  refetchItems
}: WishlistActionsProps) => {
  const router = useRouter();
  const { triggerRefresh } = useRefresh();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const handleEditWishlist = () => {
    onMenuClose();
    triggerRefresh();
    router.push({
      pathname: '/home/edit-wishlist',
      params: { id: wishlistId }
    });
  };

  const handleDeleteWishlist = async () => {
    setConfirmDeleteVisible(false);
    setIsDeleting(true);
    
    try {
      await wishlistAPI.deleteWishlist(wishlistId);
      triggerRefresh();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Wishlist deleted successfully'
      });
      router.replace('/home/lists');
    } catch (error) {
      console.error('Failed to delete wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete wishlist'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <WishlistOptionsMenu
        visible={menuVisible}
        onClose={onMenuClose}
        onDelete={() => {
          onMenuClose();
          setConfirmDeleteVisible(true);
        }}
        onEdit={handleEditWishlist}
        onSelectItems={() => {
          onMenuClose();
          onEnterSelectionMode();
        }}
      />

      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Delete Wishlist"
        message="Are you sure you want to delete this wishlist and all its items? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteWishlist}
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

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});