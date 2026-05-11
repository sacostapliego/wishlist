import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/app/context/AuthContext';
import { wishlistAPI } from '../services/wishlist';
import { WishlistItemDetails } from '../types/wishlist';

export const useItemClaiming = (item: WishlistItemDetails | null, refetchItemData: () => Promise<void>) => {
    const { user } = useAuth();
    const [showGuestNameModal, setShowGuestNameModal] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [isClaimLoading, setIsClaimLoading] = useState(false);

    const handleClaimItem = async () => {
        if (!item) return;

        // If user is not authenticated, show guest modal immediately
        if (!user?.id) {
            setShowGuestNameModal(true);
            return;
        }

        setIsClaimLoading(true);
        try {
            const result = await wishlistAPI.claimItem(item.id, { user_id: user.id });
            await refetchItemData();
        } catch (error) {
            console.error('Error claiming item:', error);
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

        if (!item) {
            Alert.alert('Error', 'Item not found');
            return;
        }

        setIsClaimLoading(true);
        try {
            await wishlistAPI.claimItem(item.id, { guest_name: guestName.trim() });
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
            const itemWithClaiming = item as any;
            const unclaimData = user?.id 
                ? { user_id: user.id }
                : { guest_name: itemWithClaiming.claimed_by_name || '' };
                
            await wishlistAPI.unclaimItem(item.id, unclaimData);
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

    // Fix: Ensure these return boolean values, not undefined
    const isItemClaimed = Boolean(item?.claimed_by_user_id || item?.claimed_by_name);
    const canUserUnclaim = Boolean(
        user?.id 
            ? item?.claimed_by_user_id === user.id
            : item?.claimed_by_name // This could be a string, so wrap in Boolean()
    );

    return {
        // State
        showGuestNameModal,
        guestName,
        setGuestName,
        isClaimLoading,
        
        // Computed values - now guaranteed to be boolean
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