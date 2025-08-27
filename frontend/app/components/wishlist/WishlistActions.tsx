import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { wishlistAPI } from '../../services/wishlist';
import { COLORS } from '../../styles/theme';
import Toast from 'react-native-toast-message';
import WishlistOptionsMenu from '../modals/WishlistOptionsMenu';
import ConfirmDialog from '../modals/Confirm';
import { useRouter } from 'expo-router';
import { useRefresh } from '../../context/RefreshContext';
import ShareLinkModal from '../modals/ShareLinkModal';
import { WishlistActionsProps } from '@/app/types/wishlist';

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
  const [isSharing, setIsSharing] = useState(false);
  const [shareLinkModalVisible, setShareLinkModalVisible] = useState(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);

  const handleEditWishlist = () => {
    onMenuClose();
    triggerRefresh();
    router.push({
      pathname: '/home/lists/edit-wishlist',
      params: { id: wishlistId }
    });
  };

  const handleDeleteWishlist = async () => {
    setConfirmDeleteVisible(false);
    setIsDeleting(true);
    
    try {
      await wishlistAPI.deleteWishlist(wishlistId);
      triggerRefresh();
      router.push('/home/lists');
    } catch (error) {
      console.error('Failed to delete wishlist:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareWishlist = async () => {
    console.log('[handleShareWishlist] Called');
    onMenuClose();
    setIsSharing(true);
    setGeneratedShareUrl(null);
    setShareLinkModalVisible(false); 

    let shareUrlResult: string | null = null;

    try {
      await wishlistAPI.updateWishlist(wishlistId, { is_public: true });

      let webBaseUrl = process.env.EXPO_PUBLIC_APP_URL;
      shareUrlResult = `${webBaseUrl}shared/${wishlistId}`;
    } catch (error) {
      shareUrlResult = null; 
    } finally {
      setIsSharing(false); // Hide loading indicator for primary operations
      setGeneratedShareUrl(shareUrlResult);
      setShareLinkModalVisible(true); 
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
        onShare={handleShareWishlist}
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

      {(isDeleting || isSharing) && ( // This loading overlay is for delete and share link generation
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      <ShareLinkModal
        visible={shareLinkModalVisible}
        shareUrl={generatedShareUrl}
        onClose={() => {
          setShareLinkModalVisible(false);
          setGeneratedShareUrl(null); // Reset for next time
        }}
      />
    </>
  );
};

export default WishlistActions;

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});