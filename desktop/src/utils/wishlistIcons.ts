import { LuGift, LuShoppingCart, LuTag, LuStar, LuHeart, LuDiamond, LuBike, LuGamepad2, LuShirt, LuPlane, LuHouse, LuBook } from 'react-icons/lu'
import type { IconType } from 'react-icons'
import { API_URL } from '../services/api'

export const WISHLIST_ICON_MAP: Record<string, IconType> = {
  'gift-outline': LuGift,
  'cart-outline': LuShoppingCart,
  'pricetag-outline': LuTag,
  'star-outline': LuStar,
  'heart-outline': LuHeart,
  'diamond-outline': LuDiamond,
  'bicycle-outline': LuBike,
  'game-controller-outline': LuGamepad2,
  'shirt-outline': LuShirt,
  'airplane-outline': LuPlane,
  'home-outline': LuHouse,
  'book-outline': LuBook,
}

export const DEFAULT_ICON = LuGift

export const getWishlistIcon = (iconName?: string | null): IconType => {
  if (!iconName) return DEFAULT_ICON
  return WISHLIST_ICON_MAP[iconName] || DEFAULT_ICON
}

/**
 * Resolve a wishlist's thumbnail to either an icon component or an image URL.
 * Handles backward compatibility where thumbnail_icon may be null.
 */
export function resolveWishlistThumbnail(wishlist: {
  id?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
  image?: string
}): { type: 'icon'; icon: IconType } | { type: 'image'; url: string } {
  if (wishlist.thumbnail_type === 'image' && wishlist.thumbnail_image && wishlist.id) {
    return { type: 'image', url: `${API_URL}wishlists/${wishlist.id}/thumbnail` }
  }
  const iconKey = wishlist.thumbnail_icon || wishlist.image || null
  return { type: 'icon', icon: getWishlistIcon(iconKey) }
}