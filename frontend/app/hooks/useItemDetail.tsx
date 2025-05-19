import { useState, useEffect, useCallback } from 'react';
import wishlistAPI from '../services/wishlist';
import { WishlistItemDetails } from '../types/wishlist'; 

export const useItemDetail = (
  itemId: string | undefined,
  wishlistId: string | undefined,
  refreshTimestamp: number,
  isPublicView: boolean = false 
) => {
  const [item, setItem] = useState<WishlistItemDetails | null>(null);
  const [wishlistColor, setWishlistColor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!itemId || !wishlistId) {
      setError("Item ID or Wishlist ID is missing.");
      setIsLoading(false);
      setItem(null);
      setWishlistColor(undefined);
      return;
    }

    setIsLoading(true);
    setError(null);
    setItem(null); 
    setWishlistColor(undefined);

    try {
      if (isPublicView) {
        // Public view: Use public API endpoints
        const publicWishlist = await wishlistAPI.getPublicWishlist(wishlistId as string);
        if (publicWishlist && publicWishlist.color) {
          setWishlistColor(publicWishlist.color);
        } else if (!publicWishlist) {
          setError("Wishlist not found or is not public.");
          setIsLoading(false);
          return;
        }
        // else, color remains undefined or default

        // Fetch all items from the public wishlist and find the specific one
        // This assumes getPublicWishlistItems returns items with sufficient detail (WishlistItemDetails)
        const publicItems: WishlistItemDetails[] = await wishlistAPI.getPublicWishlistItems(wishlistId as string);
        const foundItem = publicItems.find(i => i.id === itemId);

        if (foundItem) {
          setItem(foundItem);
        } else {
          setError("Item not found in this public wishlist.");
        }
      } else {
        // Authenticated view: Use existing logic (protected endpoints)
        const fetchedItem = await wishlistAPI.getWisihlistItem(itemId as string);
        if (fetchedItem) {
          setItem(fetchedItem);
        } else {
          setError("Item not found.");
        }

        const fetchedWishlist = await wishlistAPI.getWishlist(wishlistId as string);
        if (fetchedWishlist && fetchedWishlist.color) {
          setWishlistColor(fetchedWishlist.color);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch item details (useItemDetail):", err.response?.data || err.message || err);
      let specificError = "Failed to load item details.";
      if (err.isAxiosError) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          specificError = "Access denied. You may need to be logged in or the content is private.";
        } else if (err.response?.status === 404) {
          specificError = "The requested item or wishlist was not found.";
        } else if (err.response?.data?.detail) {
            specificError = typeof err.response.data.detail === 'string' ? err.response.data.detail : specificError;
        }
      }
      setError(specificError);
    } finally {
      setIsLoading(false);
    }
  }, [itemId, wishlistId, isPublicView, refreshTimestamp]); // Added isPublicView and refreshTimestamp

  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData is memoized and includes all its own dependencies

  return { item, wishlistColor, isLoading, error, refetchItemData: fetchData };
};