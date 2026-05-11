import { useState, useEffect, useCallback } from 'react'
import { wishlistAPI } from '../services/wishlist'
import type { WishlistItem, Wishlist, ApiError } from '../types/types'

export const useWishlistDetail = (
  wishlistId: string | undefined,
  _isPublicView?: boolean,
  fetchItemsOnly: boolean = false
) => {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async (wId: string): Promise<WishlistItem[]> => {
    try {
      // Try authenticated endpoint first (works for owner + friends)
      const fetchedItems = await wishlistAPI.getWishlistItems(wId)
      return fetchedItems
    } catch (authError) {
      const apiError = authError as ApiError

      // Only fall back to public if it's a 401/403 (not authed or no access)
      if (
        apiError.response?.status === 401 ||
        apiError.response?.status === 403 ||
        apiError.response?.status === 404
      ) {
        try {
          const publicItems = await wishlistAPI.getPublicWishlistItems(wId)
          return publicItems
        } catch (publicError) {
          return []
        }
      }

      return []
    }
  }, [])

  const fetchWishlistDetails = useCallback(async () => {
    if (!wishlistId) {
      setError('Wishlist ID is missing.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (fetchItemsOnly) {
        const fetchedItems = await fetchItems(wishlistId)
        setItems(fetchedItems)
      } else {
        let fetchedWishlist: Wishlist | null = null

        try {
          fetchedWishlist = await wishlistAPI.getWishlist(wishlistId)
        } catch (authError) {
          try {
            fetchedWishlist = await wishlistAPI.getPublicWishlist(wishlistId)
          } catch (publicError) {
            const publicApiError = publicError as ApiError
            if (publicApiError.response?.status === 403) {
              setError('Access denied. This wishlist is private.')
            } else if (publicApiError.response?.status === 404) {
              setError('Wishlist not found.')
            } else {
              setError('Failed to load wishlist details.')
            }
            setIsLoading(false)
            return
          }
        }

        if (fetchedWishlist) {
          setWishlist(fetchedWishlist)
          const fetchedItems = await fetchItems(wishlistId)
          setItems(fetchedItems)
        }
      }
    } catch (err) {
      const apiError = err as ApiError
      setError(
        typeof apiError.response?.data?.detail === 'string'
          ? apiError.response.data.detail
          : 'Failed to load wishlist details.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [wishlistId, fetchItemsOnly, fetchItems])

  useEffect(() => {
    fetchWishlistDetails()
  }, [fetchWishlistDetails])

  return {
    wishlist,
    items,
    isLoading,
    error,
    refetchItems: fetchWishlistDetails,
  }
}