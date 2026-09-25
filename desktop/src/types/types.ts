// Wishlist Types

/** Whether the list's owner is allowed to see who claimed what. */
export type WishlistVisibility = 'blind' | 'open'

export interface Wishlist {
  id: string
  title: string
  description?: string
  owner_id: string
  is_public: boolean
  color?: string
  image?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
  item_count?: number
  updated_at?: string
  created_at?: string
  // Added fields (2026)
  use_item_colors?: boolean
  default_view?: 'grid' | 'list'
  due_date?: string | null
  /**
   * 'blind' - the owner never sees who claimed what on their own list.
   * 'open'  - the owner sees claims, and visitors are told before they claim.
   */
  visibility_mode?: WishlistVisibility
  // Additional optional properties from different API endpoints
  owner_name?: string
  owner_username?: string
  wishlist_name?: string
  user_id?: string
  username?: string
}

export interface WishlistItem {
  id: string
  name: string
  description?: string
  image?: string
  price?: number
  url?: string
  wishlist_id: string
  priority: number
  is_claimed?: boolean | null
  claimed_by?: string
  claimed_by_display_name?: string
  /** Server-computed: true when the requester is the one who claimed it. */
  claimed_by_viewer?: boolean
  created_at?: string
  updated_at?: string

  /**
   * Contribution items are chipped in toward by several people rather than
   * claimed outright by one, and the two are mutually exclusive. `price` doubles
   * as the funding goal - no price means no target, so the item shows a running
   * total instead of a progress bar.
   */
  is_contribution?: boolean
  /** The owner's own declared head start. Counted in the total, never the count. */
  owner_seed_amount?: number | null
  /** Seed plus every pledge this viewer is allowed to see. */
  contribution_total?: number | null
  /** How many other people have chipped in. Excludes the owner's seed. */
  contribution_count?: number | null
  /**
   * True when the viewer owns a blind list, so the figures above were withheld.
   * It says "you cannot see this", not "there is something to see" - it is the
   * same whether ten people have pledged or nobody has. Render the blank
   * honestly rather than as "$0 of $5,000".
   */
  contributions_hidden?: boolean
}

/** One person's pledge toward a contribution item. */
export interface ItemContribution {
  id: string
  amount: number
  note?: string | null
  created_at?: string
  /** Resolved server-side; the raw contributor ids never leave the server. */
  contributor_display_name?: string | null
  /** Server-computed: true when the requester made this pledge. */
  is_mine: boolean
}

export interface CreateWishlistData {
  title: string
  description?: string
  is_public: boolean
  color?: string
  image?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: File | null
  // Added fields (2026)
  use_item_colors?: boolean
  default_view?: 'grid' | 'list'
  due_date?: string | null
  visibility_mode?: WishlistVisibility
}

export interface UpdateWishlistData {
  title?: string
  description?: string
  is_public?: boolean
  color?: string
  image?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: File | null
  remove_thumbnail_image?: boolean
  // Added fields (2026)
  use_item_colors?: boolean
  default_view?: 'grid' | 'list'
  due_date?: string | null
  remove_due_date?: boolean
  visibility_mode?: WishlistVisibility
}

// User Types
export interface User {
  id: string
  username: string
  name?: string
  email?: string
  pfp?: string
  shoe_size?: string | null
  shirt_size?: string | null
  pants_size?: string | null
  hat_size?: string | null
  ring_size?: string | null
  dress_size?: string | null
  jacket_size?: string | null
}

export interface PublicUserDetails {
  id: string
  name?: string
  username: string
  pfp?: string
  shoe_size?: string | null
  shirt_size?: string | null
  pants_size?: string | null
  hat_size?: string | null
  ring_size?: string | null
  dress_size?: string | null
  jacket_size?: string | null
}

export interface UpdateUserData {
  name?: string
  email?: string
  profile_picture?: File
  shoe_size?: string
  shirt_size?: string
  pants_size?: string
  hat_size?: string
  ring_size?: string
  dress_size?: string
  jacket_size?: string
}

// Friend Types
export interface FriendWishlist {
  id: string
  title: string
  description?: string
  color?: string
  item_count: number
  owner_id: string
  owner_name: string
  owner_username: string
  image?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
  updated_at?: string
  created_at?: string
  // Added fields (2026)
  use_item_colors?: boolean
  default_view?: 'grid' | 'list'
  due_date?: string | null
}

// Item Types
export interface CreateItemData {
  name: string
  description?: string | null
  price?: number | null
  url?: string | null
  priority: number
  wishlist_id: string
  is_purchased: boolean
  is_contribution?: boolean
  owner_seed_amount?: number | null
}

export interface UpdateItemData {
  name?: string
  description?: string | null
  price?: number | null
  url?: string | null
  priority?: number
  wishlist_id?: string
  is_purchased?: boolean
  is_contribution?: boolean
  owner_seed_amount?: number | null
}

// Scraped data from URL
export interface ScrapedItemData {
  name: string
  description?: string
  price?: string
  url: string
  image?: string
  image_url?: string
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
}

// Error response
export interface ApiError extends Error {
  message: string
  errors?: Record<string, string[]>
  response?: {
    status?: number
    data?: {
      detail?: string | string[]
    }
  }
}

// Auth Types
export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}