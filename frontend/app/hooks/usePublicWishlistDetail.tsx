import { useState, useEffect } from 'react';
import { wishlistAPI } from '../services/wishlist';
import { userAPI } from '../services/user';
import { API_URL } from '../services/api';

interface OwnerDisplayInfo {
  name?: string;
  username?: string;
  profileImageUrl?: string;
}

export const usePublicWishlistDetail = (wishlistId: string, refreshTimestamp?: number) => {
  const [wishlist, setWishlist] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [ownerDisplayInfo, setOwnerDisplayInfo] = useState<OwnerDisplayInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlistDetails = async () => {
    setIsLoading(true);
    setWishlist(null);
    setItems([]);
    setOwnerDisplayInfo(null);
    
    try {
      const wishlistData = await wishlistAPI.getPublicWishlist(wishlistId);
      setWishlist(wishlistData);

      if (wishlistData && wishlistData.user_id) {
        try {
          const publicOwnerDetails = await userAPI.getPublicUserDetails(wishlistData.user_id);
          
          // Fix: Use the owner's ID, not the current user's ID for profile image
          const imageUrl = publicOwnerDetails.pfp 
            ? `${API_URL}users/${wishlistData.user_id}/profile-image` // Use wishlistData.user_id instead
            : undefined;

          setOwnerDisplayInfo({
            name: publicOwnerDetails.name,
            username: publicOwnerDetails.username,
            profileImageUrl: imageUrl, 
          });
        } catch (userError) {
          console.error('Failed to fetch public owner details:', userError);
          setOwnerDisplayInfo(null); 
        }
      } else {
        console.warn('No user_id found in wishlist data');
        setOwnerDisplayInfo(null);
      }

      // Fetch items
      try {
        const itemsData = await wishlistAPI.getPublicWishlistItems(wishlistId);
        setItems(itemsData || []);
      } catch (itemsError) {
        console.error('Failed to fetch wishlist items:', itemsError);
        setItems([]);
      }

    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      setWishlist(null);
      setItems([]);
      setOwnerDisplayInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (wishlistId) {
      fetchWishlistDetails();
    }
  }, [wishlistId, refreshTimestamp]);

  const refetch = () => {
    fetchWishlistDetails();
  };

  return {
    wishlist,
    items,
    ownerDisplayInfo,
    isLoading,
    refetch
  };
};