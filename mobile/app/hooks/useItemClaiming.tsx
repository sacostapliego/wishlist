import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/app/context/AuthContext';
import { wishlistAPI } from '../services/wishlist';
import { guestSessionAPI, clearGuestSession, getGuestToken } from '../services/guestSession';
import { WishlistItemDetails } from '../types/wishlist';

export const useItemClaiming = (item: WishlistItemDetails | null, refetchItemData: () => Promise<void>) => {
    const { user } = useAuth();
    const [showGuestNameModal, setShowGuestNameModal] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [isClaimLoading, setIsClaimLoading] = useState(false);

    const handleClaimItem = async () => {
        if (!item) return;

        // Guests need a session before they can claim. If they already have one
        // on this wishlist we reuse it, so they only ever type their name once.
        if (!user?.id && !(await getGuestToken(item.wishlist_id))) {
            setShowGuestNameModal(true);
            return;
        }

        setIsClaimLoading(true);
        try {
            await wishlistAPI.claimItem(item.id, item.wishlist_id);
            await refetchItemData();
        } catch (error) {
            console.error('Error claiming item:', error);
            // A stale guest token is the likely cause of a 401 here, so drop it
            // and let them name themselves again.
            if (!user?.id && item.wishlist_id) {
                await clearGuestSession(item.wishlist_id);
            }
            Alert.alert('Error', 'Failed to claim item. It may already be claimed.');
        } finally {
            setIsClaimLoading(false);
        }
    };

    const handleGuestClaim = async () => {
        if (!guestName.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        if (!item?.wishlist_id) {
            Alert.alert('Error', 'Item not found');
            return;
        }

        setIsClaimLoading(true);
        try {
            // Two steps on purpose: the session is what the token belongs to,
            // and it outlives this one claim.
            await guestSessionAPI.start(item.wishlist_id, guestName.trim());
            await wishlistAPI.claimItem(item.id, item.wishlist_id);

            setShowGuestNameModal(false);
            setGuestName('');
            Alert.alert('Success', 'You have claimed this item!');
            await refetchItemData();
        } catch (error) {
            console.error('Error claiming item:', error);
            Alert.alert('Error', 'Failed to claim item. It may already be claimed.');
        } finally {
            setIsClaimLoading(false);
        }
    };

    const handleUnclaimItem = async () => {
        if (!item) return;

        setIsClaimLoading(true);
        try {
            await wishlistAPI.unclaimItem(item.id, item.wishlist_id);
            Alert.alert('Success', 'You have unclaimed this item.');
            await refetchItemData();
        } catch (error) {
            console.error('Error unclaiming item:', error);
            Alert.alert('Error', 'Failed to unclaim item.');
        } finally {
            setIsClaimLoading(false);
        }
    };

    const cancelGuestModal = () => {
        setShowGuestNameModal(false);
        setGuestName('');
    };

    // Both flags come from the server. The client no longer infers who claimed
    // what from the display name, which every visitor can see.
    const isItemClaimed = Boolean(item?.is_claimed);
    const canUserUnclaim = Boolean(item?.claimed_by_viewer);

    return {
        // State
        showGuestNameModal,
        guestName,
        setGuestName,
        isClaimLoading,

        // Computed values
        isItemClaimed,
        canUserUnclaim,

        // Actions
        handleClaimItem,
        handleGuestClaim,
        handleUnclaimItem,
        cancelGuestModal,
    };
};

export default useItemClaiming;
