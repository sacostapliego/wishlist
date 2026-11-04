import { API_URL } from '../services/api'

/**
 * The API serves a private list's images only with the token it sent alongside
 * them, because an <img> tag cannot send the login header. Shared lists' images
 * load without it, so a missing token is fine there.
 */
const withToken = (url: string, token?: string | null) =>
  token ? `${url}?t=${encodeURIComponent(token)}` : url

export const itemImageUrl = (item: {
  id?: string
  image?: string | null
  image_token?: string | null
}): string =>
  item.id && item.image ? withToken(`${API_URL}wishlist/${item.id}/image`, item.image_token) : ''

export const wishlistThumbnailUrl = (wishlist: {
  id?: string
  thumbnail_token?: string | null
}): string =>
  wishlist.id ? withToken(`${API_URL}wishlists/${wishlist.id}/thumbnail`, wishlist.thumbnail_token) : ''
