import { useState, useEffect } from 'react';
import { wishlistAPI } from '../services/wishlist';
import { WishlistApiResponse } from '../types/lists';
import { userAPI, PublicUserDetailsResponse } from '../services/user';
import { API_URL } from '../services/api'; // Import API_URL

// Local type for items if not using a global Item type
type WishlistItem = {
  id: string;
  name: string;
  image?: string;
  price?: number;
  priority: number;
};

// interface for owner's display information
interface OwnerDisplayInfo {
  name?: string;
  username: string;
  profileImageUrl?: string;
}

export const usePublicWishlistDetail = (wishlistId: string, refreshTimestamp?: number) => {
  const [wishlist, setWishlist] = useState<WishlistApiResponse | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [ownerDisplayInfo, setOwnerDisplayInfo] = useState<OwnerDisplayInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicWishlistDetails = async () => {
    if (!wishlistId) {
      setIsLoading(false);
      setError("No Wishlist ID provided");
      return;
    }
    setIsLoading(true);
    setOwnerDisplayInfo(null);
    try {
      const wishlistData = await wishlistAPI.getPublicWishlist(wishlistId);
      setWishlist(wishlistData);

      if (wishlistData && wishlistData.user_id) {
        try {
          const publicOwnerDetails = await userAPI.getPublicUserDetails(wishlistData.user_id);
          // Construct the proxy URL if pfp (direct S3 link) exists
          // The backend /users/{user_id}/profile-image endpoint will serve the image
          // This also implies that if publicOwnerDetails.pfp is null, no image should be attempted.
          const imageUrl = publicOwnerDetails.pfp 
            ? `${API_URL}users/${publicOwnerDetails.id}/profile-image` 
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
        setOwnerDisplayInfo(null); 
      }

      const itemsData = await wishlistAPI.getPublicWishlistItems(wishlistId);
      setItems(itemsData as WishlistItem[]);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch public wishlist details:', err);
      setError('Failed to load wishlist. It may not be public or an error occurred.');
      setWishlist(null);
      setItems([]);
      setOwnerDisplayInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicWishlistDetails();
  }, [wishlistId, refreshTimestamp]);

  return { wishlist, items, ownerDisplayInfo, isLoading, error, refetch: fetchPublicWishlistDetails };
};

export default usePublicWishlistDetail;