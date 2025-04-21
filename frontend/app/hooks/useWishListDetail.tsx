import { useState, useEffect } from 'react';
import { wishlistAPI } from '../services/wishlist';
import Toast from 'react-native-toast-message';
import { WishlistApiResponse } from '../types/lists';

type WishlistItem = {
  id: string;
  name: string;
  image?: string;
  price?: number;
  priority: number;
};

export const useWishlistDetail = (wishlistId: string, shouldRefresh?: number) => {
  const [wishlist, setWishlist] = useState<WishlistApiResponse | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wishlistId) {
      fetchWishlistDetails();
    }
  }, [wishlistId, shouldRefresh]);

  const fetchWishlistDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch wishlist details
      const wishlistData = await wishlistAPI.getWishlist(wishlistId);
      setWishlist(wishlistData);
      
      // Fetch items in this wishlist
      const itemsData = await wishlistAPI.getItems();
      
      // Filter items for this wishlist
      const filteredItems = itemsData.filter(
        (item: any) => item.wishlist_id === wishlistId
      );
      
      setItems(filteredItems);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch wishlist details:', error);
      setError('Failed to load wishlist details');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load wishlist details'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { wishlist, items, isLoading, error, refetch: fetchWishlistDetails };
};

export default useWishlistDetail;