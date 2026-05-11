'use client'

import { Box, VStack, Heading, Text } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { wishlistAPI } from '../services/wishlist'
import { friendsAPI } from '../services/friends'
import { useAuth } from '../context/AuthContext'
import { toaster } from '../components/ui/toaster'
import { OwnerWishlistView } from '../components/wishlists/OwnerWishlistView'
import { SharedWishlistView } from '../components/wishlists/SharedWishlistView'
import { WishlistItemView, type SortOption } from '../components/wishlists/WishlistItemView'
import { useWishlistDetail } from '../hooks/useWislistDetail'
import { WishlistFilters } from '../components/wishlists/WishlistFilters'
import { userAPI } from '../services/user'
import type { ApiError } from '../types/types'
import { SimpleGridView } from '../components/wishlists/SimpleGridView'

interface Wishlist {
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
  use_item_colors?: boolean
  default_view?: 'grid' | 'list'
  due_date?: string | null
}

interface MyWishlistResponse {
  id: string
  title: string
  description?: string
  user_id?: string
  owner_id?: string
  is_public: boolean
  color?: string
  image?: string
  item_count?: number
  updated_at?: string
  created_at?: string
  use_item_colors?: boolean
  default_view?: 'grid' | 'list'
  due_date?: string | null
}

interface FriendWishlistResponse {
  id: string;
  title: string;
  description?: string;
  color?: string;
  item_count: number;
  owner_id: string;
  owner_name: string;
  owner_username: string;
  image?: string;
  thumbnail_type?: 'icon' | 'image';
  thumbnail_icon?: string | null;
  thumbnail_image?: string | null;
  updated_at?: string;
  created_at?: string;
  use_item_colors?: boolean
  default_view?: 'grid' | 'list'
  due_date?: string | null
}

interface WishlistPageProps {
  id: string
}

function WishlistPage({ id }: WishlistPageProps) {
  const router = useRouter()
  const { user, loading: authLoading, isLoggedIn } = useAuth()
  
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [ownerName, setOwnerName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('none')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(wishlist?.default_view || 'list')

  const { items, isLoading: itemsLoading, refetchItems } = useWishlistDetail(id, undefined, true)

  useEffect(() => {
    if (id && !authLoading) {
      loadWishlist(id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authLoading, user])

  useEffect(() => {
    if (wishlist?.default_view) {
      setViewMode(wishlist.default_view)
    }
  }, [wishlist?.default_view])

  useEffect(() => {
  if (wishlist?.color) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      const newMeta = document.createElement('meta')
      newMeta.setAttribute('name', 'theme-color')
      document.head.appendChild(newMeta)
      newMeta.setAttribute('content', wishlist.color)
    } else {
      metaThemeColor.setAttribute('content', wishlist.color)
    }

    document.body.style.backgroundColor = wishlist.color
  }

  return () => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#141414')
    }

    document.body.style.backgroundColor = '#141414'
  }
}, [wishlist?.color])

  const loadWishlist = async (wishlistId: string) => {
    try {
      setLoading(true)
      setAccessDenied(false)

      if (isLoggedIn && user) {
        const [myWishlists, friendsWishlists] = await Promise.all([
          wishlistAPI.getWishlists() as Promise<MyWishlistResponse[]>,
          friendsAPI.getFriendsWishlists()
        ])

        const myWishlist = myWishlists.find((w: MyWishlistResponse) => w.id === wishlistId)
        
        if (myWishlist) {
          const fullWishlist = await wishlistAPI.getWishlist(wishlistId)
          const ownerId = fullWishlist.user_id || fullWishlist.owner_id
          setWishlist({
            ...fullWishlist,
            owner_id: ownerId || ''
          })
          setIsOwner(true)
          setOwnerName(user.name || user.username || 'You')
          return
        }

        const friendWishlist = friendsWishlists.find((w: FriendWishlistResponse) => w.id === wishlistId)
        
        if (friendWishlist) {
          setWishlist({
            id: friendWishlist.id,
            title: friendWishlist.title,
            description: friendWishlist.description,
            owner_id: friendWishlist.owner_id,
            is_public: false,
            color: friendWishlist.color,
            image: friendWishlist.image,
            thumbnail_type: friendWishlist.thumbnail_type,
            thumbnail_icon: friendWishlist.thumbnail_icon,
            thumbnail_image: friendWishlist.thumbnail_image,
            item_count: friendWishlist.item_count,
            updated_at: friendWishlist.updated_at,
            created_at: friendWishlist.created_at,
            use_item_colors: friendWishlist.use_item_colors,
            default_view: friendWishlist.default_view,
            due_date: friendWishlist.due_date,
          })
          setOwnerName(friendWishlist.owner_name || friendWishlist.owner_username)
          setIsOwner(false)
          return
        }
      }

      try {
        const publicData = await wishlistAPI.getPublicWishlist(wishlistId)
        const ownerId = publicData.user_id || publicData.owner_id
        
        setWishlist({
          ...publicData,
          owner_id: ownerId || ''
        })
        
        let extractedOwnerName = 
          publicData.owner_name || 
          publicData.owner_username || 
          publicData.username

        if (!extractedOwnerName && ownerId) {
          try {
            const ownerProfile = await userAPI.getPublicUserDetails(ownerId)
            extractedOwnerName = ownerProfile.name || ownerProfile.username || 'Unknown'
          } catch (profileError) {
            console.error('Failed to fetch owner profile:', profileError)
            extractedOwnerName = 'Unknown'
          }
        }
        
        setOwnerName(extractedOwnerName || 'Unknown')
        setIsOwner(false)
      } catch (error) {
        const apiError = error as ApiError
        if (apiError.response?.status === 403) {
          setAccessDenied(true)
        } else {
          toaster.create({
            title: 'Not Found',
            description: 'This wishlist does not exist or you do not have access',
            type: 'error',
          })
        }
      }
    } catch (error) {
      const apiError = error as ApiError
      console.error('Error loading wishlist:', apiError)
      toaster.create({
        title: 'Error',
        description: 'Failed to load wishlist',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !loading && !wishlist && !accessDenied && !itemsLoading) {
      router.replace(isLoggedIn ? '/' : '/auth/login')
    }
  }, [authLoading, loading, wishlist, accessDenied, itemsLoading, isLoggedIn, router])

  if (authLoading || loading || itemsLoading) {
    return (
      <Box h="calc(100vh - 32px)" w="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">Loading...</Text>
      </Box>
    )
  }

  if (accessDenied) {
    return (
      <Box h="calc(100vh - 32px)" w="100%" display="flex" alignItems="center" justifyContent="center" p={8}>
        <VStack gap={4}>
          <Heading size="lg" color="white">Private Wishlist</Heading>
          <Text color="gray.400" textAlign="center">
            This wishlist is private and only available to the owner and their friends.
          </Text>
        </VStack>
      </Box>
    )
  }

  if (!wishlist) {
    return null
  }

  return (
    <Box h="calc(100vh - 32px)" w="100%" overflowY="auto" overflowX="hidden">
      <VStack align="stretch" gap={0}>
        {isOwner ? (
          <OwnerWishlistView 
            wishlist={{ 
              ...wishlist, 
              owner: user?.name || 'Unknown', 
              owner_id: user?.id 
            }}
            onItemAdded={refetchItems}
            refetchItems={refetchItems}
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />
        ) : (
          <SharedWishlistView 
            wishlist={{
              ...wishlist,
              owner_name: ownerName || 'Unknown',
              owner_id: wishlist.owner_id
            }}
          />
        )}
        
        {items.length > 0 && (
          <WishlistFilters 
            sortBy={sortBy}
            onSortChange={setSortBy}
            wishlistColor={wishlist.color}
          />
        )}

        {items.length > 0 ? (
          viewMode === 'list' ? (
            <WishlistItemView 
              items={items}
              wishlistColor={wishlist.use_item_colors ? wishlist.color : undefined}
              sortBy={sortBy}
              onItemClick={(item) => router.push(`/wishlist/${wishlist.id}/${item.id}`)}
              isSelectionMode={isSelectionMode}
              selectedItems={selectedItems}
              onToggleSelect={(itemId) => {
                setSelectedItems(prev => 
                  prev.includes(itemId) 
                    ? prev.filter(id => id !== itemId)
                    : [...prev, itemId]
                )
              }}
            />
          ) : (
            <SimpleGridView
              items={items}
              wishlistColor={wishlist.use_item_colors ? wishlist.color : undefined}
              sortBy={sortBy}
              onItemClick={(item) => router.push(`/wishlist/${wishlist.id}/${item.id}`)}
            />
          )
        ) : (
          <Box px={8} py={4}>
            <Text color="gray.400">No items yet...</Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export default WishlistPage
