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
  description?: string
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

const TODO_TEXT = 'TODO'
const UNIFIED_COLOR = 'rgb(124, 58, 237)'

export const LANDING_DEMO_WISHLISTS: LandingDemoWishlist[] = [
  {
    id: 'demo-wl-owner-birthday',
    name: 'Birthday',
    color: 'rgb(70, 130, 180)',
    demo_thumbnail_url: '/landing/demo-wishlist/cat.JPG',
  },
  {
    id: 'demo-wl-owner-christmas',
    name: 'Christmas',
    color: 'rgb(196, 30, 58)',
    demo_thumbnail_url: '/landing/demo-wishlist/luma.JPG',
  },
]

export const LANDING_DEMO_FRIENDS: LandingDemoWishlist[] = [
  {
    id: 'demo-wl-friend-birthday',
    name: 'Birthday',
    color: 'rgb(196, 30, 58)',
    demo_thumbnail_url: '/landing/demo-wishlist/album.JPG',
    owner_label: 'Alex',
  },
  {
    id: 'demo-wl-friend-baby-shower',
    name: 'Baby Shower Gifts',
    color: 'rgb(70, 130, 180)',
    demo_thumbnail_url: '/landing/demo-wishlist/babyshower.JPG',
    owner_label: 'Noah',
  },
  {
    id: 'demo-wl-friend-housewarming',
    name: 'Gifts for my new room',
    color: 'rgb(23, 148, 79)',
    demo_thumbnail_url: '/landing/demo-wishlist/room.JPG',
    owner_label: 'Giovanni',
  },
  {
    id: 'demo-wl-friend-valentines',
    name: 'Valentines Day',
    color: 'rgb(232, 158, 184)',
    demo_thumbnail_url: '/landing/demo-wishlist/heart.JPG',
    owner_label: 'Eva',
  },
]

export const LANDING_DEMO_CLAIMED: LandingDemoClaimed[] = [
  {
    id: 'demo-item-friend-birthday-1',
    name: 'Nvida 5090',
    owner_name: 'Alex',
    color: 'rgb(196, 30, 58)',
    image_url: '/landing/demo-items/nvidia5090.png',
    price: 799,
    wishlist_id: 'demo-wl-friend-birthday',
  },
  {
    id: 'demo-item-friend-valentines-1',
    name: 'Miss Dior Essence perfume',
    owner_name: 'Eva',
    color: 'rgb(232, 158, 184)',
    image_url: '/landing/demo-items/perfume.png',
    price: 29.99,
    wishlist_id: 'demo-wl-friend-valentines',
  },
]

/** Claimed cards use ids that exist in LANDING_DEMO_ITEMS, so no synthetic rows needed. */
export const LANDING_DEMO_CLAIMED_ITEMS: LandingDemoItem[] = []

export const LANDING_DEMO_ITEMS: Record<string, LandingDemoItem[]> = {
  'demo-wl-owner-birthday': [
    {
      id: 'demo-item-owner-birthday-1',
      wishlist_id: 'demo-wl-owner-birthday',
      name: 'never enough album viynl',
      priority: 2,
      price: 30.00,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      image_url: '/landing/demo-items/album.png',
      url: 'https://vertigovinyl.com/store/p/never-enough-daniel-caesar?srsltid=AfmBOorvbjVY1aeGsaoPYdKx3L00C1G5SAPtk6fnYCtJ9qHhF1X8K5vuN_k',
    },
    {
      id: 'demo-item-owner-birthday-2',
      wishlist_id: 'demo-wl-owner-birthday',
      name: 'Born in Roma Uomo Eau de Parfum Intense',
      priority: 2,
      price: 160.00,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      image_url: '/landing/demo-items/valentino.png',
      url: 'https://www.valentino-beauty.us/fragrances/fragrances-men/born-in-roma-uomo-intense/born-in-roma-uomo-eau-de-parfum-intense-MPL01907.html?srsltid=AfmBOopPq7EOf8lsSHzBWYyLERDi6JZGr2nM3zdK98EcDJ7LWCkQQYJY',
    },
  ],
  'demo-wl-owner-christmas': [
    {
      id: 'demo-item-owner-christmas-1',
      wishlist_id: 'demo-wl-owner-christmas',
      name: 'XM6',
      priority: 2,
      price: 459.00,
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      image_url: '/landing/demo-items/xm6.png',
      url: 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm6-b?srsltid=AfmBOoqPq5fdRr2JKfk63Gjc2LT69WPPWUMNJe44cCwuvRqjPbBEQf6v',
    },
  ],
  'demo-wl-friend-birthday': [
    {
      id: 'demo-item-friend-birthday-1',
      wishlist_id: 'demo-wl-friend-birthday',
      name: 'Nvida 5090',
      description: 'Please try and get the founders edition if possible :)',
      priority: 8,
      price: 799,
      created_at: TODO_TEXT,
      image_url: '/landing/demo-items/nvidia5090.png',
    },
    {
      id: 'demo-item-friend-birthday-2',
      wishlist_id: 'demo-wl-friend-birthday',
      name: 'Nike Zoom Vomero 5',
      priority: 0,
      price: 170,
      created_at: TODO_TEXT,
      image_url: '/landing/demo-items/whitenikes.png',
      url: 'https://www.nike.com/t/zoom-vomero-5-mens-shoes-MgsTqZ/BV1358-001?nikemt=true&cp=36419719306_search_--g-23828850877-194969705974--c-12577013-00192501310242&dplnk=member&gclsrc=aw.ds&gad_source=1&gad_campaignid=23828850877&gbraid=0AAAAADy86kOQFP5jA70ve1EsA0nfFgMtQ&gclid=Cj0KCQjwzqXQBhD2ARIsAKrIeU_hYjY8ps-WtNRtPRSyoZTejCWOO-dnFCL6lfg6MIo2-qcwVe-r0rEaAnkpEALw_wcB',
    },
  ],
  'demo-wl-friend-baby-shower': [
    {
      id: 'demo-item-friend-baby-shower-1',
      wishlist_id: 'demo-wl-friend-baby-shower',
      name: 'Baby Bear Set',
      priority: 0,
      price: 55.00,
      created_at: TODO_TEXT,
      image_url: '/landing/demo-items/bear.png',
      url: 'https://www.thenorthface.com/en-us/p/kids/baby-0-24m/baby-accessories-226756/baby-bear-set-NF0A8EMX?color=BQ8&utm_content=ecomm&utm_medium=cpc&utm_source=google&utm_campaign=US+%7C+all+%7C+Hybrid+%7C+SHOP+-+AUT+%7E+All+Br+-+Kid+Gen+Cluster+-+PMax+Shopping&utm_term=&gclsrc=aw.ds&gad_source=1&gad_campaignid=23059831573&gbraid=0AAAAADl87iboU_a52BBQfaU1T3rD2uorE&gclid=Cj0KCQjwzqXQBhD2ARIsAKrIeU-VNc-DHGuG9kjt3bxPiZuzT0h3lvqPVLZiq_lEqwwu3PC0WGs-DC0aAnA8EALw_wcB',
    },
  ],
  'demo-wl-friend-housewarming': [
    {
      id: 'demo-item-friend-housewarming-1',
      wishlist_id: 'demo-wl-friend-housewarming',
      name: 'TVÄRHAND',
      description: 'Table lamp, black/bamboo',
      priority: 0,
      price: 24.99,
      created_at: TODO_TEXT,
      image_url: '/landing/demo-items/ikealamp.png',
      url: 'https://www.ikea.com/us/en/p/tvaerhand-table-lamp-black-bamboo-60518410/?gad_source=1&gad_campaignid=22406995679&gbraid=0AAAAAD27g7yBS4JIB7Caf8Ec_5ju1yeCT&gclid=Cj0KCQjwzqXQBhD2ARIsAKrIeU8SbQMGpoUbCrIGDaySoAtyqihMHr2ITTFAWELVlEpwR2v-yYSzKtUaAv_zEALw_wcB',
    },
    {
      id: 'demo-item-friend-housewarming-2',
      wishlist_id: 'demo-wl-friend-housewarming',
      name: 'LINDBYN',
      priority: 0,
      price: 89.99,
      created_at: TODO_TEXT,
      image_url: '/landing/demo-items/ikeamirror.png',
      url: 'https://www.ikea.com/us/en/p/lindbyn-mirror-black-40597234/',
    },
  ],
  'demo-wl-friend-valentines': [
    {
      id: 'demo-item-friend-valentines-1',
      wishlist_id: 'demo-wl-friend-valentines',
      name: 'Miss Dior Essence perfume',
      description: '2.7oz eau de parfum spray',
      priority: 9,
      price: 198.99,
      created_at: TODO_TEXT,
      image_url: '/landing/demo-items/perfume.png',
      url: 'https://www.dior.com/en_us/beauty/products/miss-dior-essence-Y0000088.html',
    },
    {
      id: 'demo-item-friend-valentines-2',
      wishlist_id: 'demo-wl-friend-valentines',
      name: 'Kate spade purse',
      priority: 0,
      price: 189.99,
      created_at: TODO_TEXT,
      image_url: '/landing/demo-items/katespade.png',
      url: 'https://www.katespadeoutlet.com/products/kayla-mini-bag/KK057-001.html?KSNY=true&ogmap=PLA%7CRTN%7CGOOG%7CSTND%7Cc%7CSITEWIDE%7CSurprise%7CKS_OTL_Google_PLA_Signal_NA_Generic_National_PMax_NA_BAU_Wallets%7CSitewide_Regular_Core_NA%7C%7C22256247569%7C%7CUS&utm_source=google&utm_medium=cpc&utm_campaign=KS_OTL_Google_PLA_Signal_NA_Generic_National_PMAX_NA_BAU_Wallets&gclsrc=aw.ds&gad_source=1&gad_campaignid=22256249225&gbraid=0AAAAADJUeEX7o_x4ig51R46xrrZvr1rDn&gclid=Cj0KCQjwzqXQBhD2ARIsAKrIeU89y2EH58IMsTmpBxLKUfdsujm5zD_8bEEu663plwjmEttdbPwzqLYaAvLnEALw_wcB',
    },
  ],
}

export const LANDING_ALL_DEMO_WISHLISTS: LandingDemoWishlist[] = [...LANDING_DEMO_WISHLISTS, ...LANDING_DEMO_FRIENDS]

export function isDemoWishlistMine(id: string): boolean {
  return LANDING_DEMO_WISHLISTS.some((w) => w.id === id)
}
