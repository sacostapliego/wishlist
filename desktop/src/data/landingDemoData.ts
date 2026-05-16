/**
 * Static sample data for the marketing landing interactive demo only.
 * No backend; safe to import from client components.
 */

export interface LandingDemoWishlist {
  id: string
  name: string
  color: string
  /** Sidebar + hero thumbnail (absolute URL — no API). */
  demo_thumbnail_url: string
  description?: string
  /** Optional icon key fallback if demo_thumbnail_url omitted (unused when URL set). */
  thumbnail_icon?: string | null
  /** For lists shown under “Friends”: name shown below the wishlist title. */
  owner_label?: string
}

export interface LandingDemoItem {
  id: string
  wishlist_id: string
  name: string
  description: string
  price?: number
  priority: number
  created_at: string
  image_url: string
  url?: string | null
}

export interface LandingDemoClaimed {
  id: string
  name: string
  owner_name: string
  price?: number
  color: string
  image_url: string
  wishlist_id: string
}

/** Fixed Picsum assets for repeatable demo thumbnails. */
const IMG = {
  kettle: 'https://picsum.photos/id/312/400/400',
  headphones: 'https://picsum.photos/id/60/400/400',
  book: 'https://picsum.photos/id/24/400/400',
  watch: 'https://picsum.photos/id/175/400/400',
  plant: 'https://picsum.photos/id/106/400/400',
  camera: 'https://picsum.photos/id/250/400/400',
  lamp: 'https://picsum.photos/id/364/400/400',
  boots: 'https://picsum.photos/id/21/400/400',
} as const

const COVER = {
  birthday: 'https://picsum.photos/id/429/600/600',
  holiday: 'https://picsum.photos/id/525/600/600',
  everyday: 'https://picsum.photos/id/866/600/600',
  friend1: 'https://picsum.photos/id/119/600/600',
  friend2: 'https://picsum.photos/id/669/600/600',
} as const

export const LANDING_DEMO_WISHLISTS: LandingDemoWishlist[] = [
  {
    id: 'demo-wl-birthday',
    name: 'Birthday 2026',
    color: 'rgb(124, 58, 237)',
    demo_thumbnail_url: COVER.birthday,
    description: 'Big upgrades and treats for turning one year older.',
  },
  {
    id: 'demo-wl-holiday',
    name: 'Holiday gifts',
    color: 'rgb(13, 148, 136)',
    demo_thumbnail_url: COVER.holiday,
    description: 'Ideas for family exchanges and office parties.',
  },
  {
    id: 'demo-wl-everyday',
    name: 'Everyday wants',
    color: 'rgb(194, 65, 12)',
    demo_thumbnail_url: COVER.everyday,
    description: 'Small splurges and practical picks.',
  },
]

export const LANDING_DEMO_FRIENDS: LandingDemoWishlist[] = [
  {
    id: 'demo-wl-friend-1',
    name: "Sam's picks",
    color: 'rgb(59, 130, 246)',
    demo_thumbnail_url: COVER.friend1,
    description: 'Game night crowd-pleasers.',
    owner_label: 'Sam Rivera',
  },
  {
    id: 'demo-wl-friend-2',
    name: 'Office Secret Santa',
    color: 'rgb(34, 197, 94)',
    demo_thumbnail_url: COVER.friend2,
    description: 'Under-$30 ideas for coworkers.',
    owner_label: 'Jamie Chen',
  },
]

export const LANDING_DEMO_CLAIMED: LandingDemoClaimed[] = [
  {
    id: 'demo-item-claimed-1',
    name: 'Ceramic mug set',
    owner_name: 'Alex',
    price: 34.99,
    color: 'rgb(71, 85, 105)',
    image_url: IMG.lamp,
    wishlist_id: 'demo-wl-friend-1',
  },
  {
    id: 'demo-item-claimed-2',
    name: 'Running shoes',
    owner_name: 'Jordan',
    price: 129,
    color: 'rgb(180, 83, 9)',
    image_url: IMG.boots,
    wishlist_id: 'demo-wl-friend-2',
  },
]

export const LANDING_DEMO_ITEMS: Record<string, LandingDemoItem[]> = {
  'demo-wl-birthday': [
    {
      id: 'demo-item-b1',
      wishlist_id: 'demo-wl-birthday',
      name: 'Electric kettle',
      description: 'Fits the counter space and auto-shutoff. Sample entry for the demo.',
      price: 89.5,
      priority: 4,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      image_url: IMG.kettle,
      url: 'https://www.example.com/products/demo-kettle',
    },
    {
      id: 'demo-item-b2',
      wishlist_id: 'demo-wl-birthday',
      name: 'Noise-cancelling headphones',
      description: 'Over-ear, comfortable for long calls. Demo only — not your real list.',
      price: 249,
      priority: 3,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      image_url: IMG.headphones,
      url: 'https://www.example.com/products/demo-headphones',
    },
    {
      id: 'demo-item-b3',
      wishlist_id: 'demo-wl-birthday',
      name: 'Hardcover journal',
      description: 'Dot grid, lay-flat binding.',
      price: 22,
      priority: 1,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      image_url: IMG.book,
    },
  ],
  'demo-wl-holiday': [
    {
      id: 'demo-item-h1',
      wishlist_id: 'demo-wl-holiday',
      name: 'Analog watch',
      description: 'Minimal dial, leather strap.',
      price: 185,
      priority: 4,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      image_url: IMG.watch,
    },
    {
      id: 'demo-item-h2',
      wishlist_id: 'demo-wl-holiday',
      name: 'Desk plant',
      description: 'Low-light friendly.',
      price: 45,
      priority: 2,
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      image_url: IMG.plant,
    },
    {
      id: 'demo-item-h3',
      wishlist_id: 'demo-wl-holiday',
      name: 'Film camera',
      description: 'Point-and-shoot style.',
      price: 320,
      priority: 0,
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      image_url: IMG.camera,
    },
  ],
  'demo-wl-everyday': [
    {
      id: 'demo-item-e1',
      wishlist_id: 'demo-wl-everyday',
      name: 'Reading lamp',
      description: 'Warm LED, dimmable.',
      price: 62,
      priority: 2,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      image_url: IMG.lamp,
    },
    {
      id: 'demo-item-e2',
      wishlist_id: 'demo-wl-everyday',
      name: 'Leather boots',
      description: 'Water-resistant.',
      price: 198,
      priority: 3,
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      image_url: IMG.boots,
    },
  ],
  'demo-wl-friend-1': [
    {
      id: 'demo-item-f11',
      wishlist_id: 'demo-wl-friend-1',
      name: 'Board game',
      description: 'Co-op for four players.',
      price: 55,
      priority: 2,
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      image_url: IMG.book,
      url: 'https://www.example.com/products/demo-boardgame',
    },
  ],
  'demo-wl-friend-2': [
    {
      id: 'demo-item-f21',
      wishlist_id: 'demo-wl-friend-2',
      name: 'Chocolate sampler',
      description: 'Assorted — demo item.',
      price: 28,
      priority: 2,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      image_url: IMG.plant,
    },
  ],
}

export const LANDING_ALL_DEMO_WISHLISTS: LandingDemoWishlist[] = [...LANDING_DEMO_WISHLISTS, ...LANDING_DEMO_FRIENDS]

export function isDemoWishlistMine(id: string): boolean {
  return LANDING_DEMO_WISHLISTS.some((w) => w.id === id)
}
