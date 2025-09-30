import React from 'react';
import { useAuth } from '@/app/context/AuthContext';
import WishlistDetailScreen from '@/app/components/features/wishlist/screens/WishlistDetailScreen';
import SharedWishlistDetailScreen from '@/app/components/features/wishlist/screens/SharedWishlistDetailScreen';
import { LoadingState } from '@/app/components/common/LoadingState';
import { useLocalSearchParams } from 'expo-router';

export default function WishlistRouteSelector() {
  const { user, loading: isAuthLoading } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (isAuthLoading) {
    return <LoadingState />;
  }

  // If the user is authenticated and owns the wishlist, show the private WishlistDetailScreen
  if (user) {
    return <WishlistDetailScreen />;
  }

  // If the user is not authenticated or is a guest, show the SharedWishlistDetailScreen
  return <SharedWishlistDetailScreen />;
}
