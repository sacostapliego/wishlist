import React from 'react';
import { useAuth } from '@/app/context/AuthContext';
import OwnerWishlistItemScreen from '@/app/components/features/item/screens/WishlistItemScreen'; 
import SharedWishlistItemScreen from '@/app/components/features/item/screens/SharedWishlistItemScreen';
import { LoadingState } from '@/app/components/common/LoadingState'; 
import { useLocalSearchParams } from 'expo-router';

export default function WishlistItemRouteSelector() {
    const { user, loading: isAuthLoading } = useAuth();
    
    const params = useLocalSearchParams(); 

    if (isAuthLoading) {
        return <LoadingState />; 
    }

    // 1. If the user is authenticated:
    // This is the /home/lists route, so we assume they want the owner/private view logic.
    // The OwnerWishlistItemScreen should handle fetching the private (isPublic: false) item data.
    if (user) {
        return <OwnerWishlistItemScreen />;
    } 
    
    // 2. If the user is NOT authenticated (Guest):
    // They should not be on the /home/lists route. If they somehow landed here, 
    // it's an error or a route mismatch. Redirect them to the /shared view,
    // or, for simplicity in a broken state, show them the read-only Shared view.
    return <SharedWishlistItemScreen />;
}