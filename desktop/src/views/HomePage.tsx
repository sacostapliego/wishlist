'use client'

import { Box, VStack, HStack, Heading, Button } from '@chakra-ui/react'
import { ClaimedItemsSection } from '../components/home/ClaimedItemSection'
import { WishlistCarousel } from '../components/home/WishlistCarousel'
import { useEffect, useState } from 'react'
import { wishlistAPI, type ClaimedItemResponse } from '../services/wishlist'
import { friendsAPI, type FriendWishlistResponse } from '../services/friends'
import { toaster } from '../components/ui/toaster'
import { useRouter } from 'next/navigation'
import { ProfileHeader } from '../components/layout/ProfileHeader'
import { COLORS } from '../styles/common'
import { isWishlistActive } from '../utils/wishlistUtils'
import type { Wishlist as WishlistType } from '../types/types'

interface Wishlist {
  id: string
  name: string
  image?: string
  color?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
  due_date?: string | null
}

interface ClaimedItem {
  id: string
  name: string
  price?: number
  image?: string
  owner_name: string
  color?: string
  wishlist_id?: string
  wishlist_due_date?: string | null
}

function EmptySectionHeader({ title, onShowAll }: { title: string; onShowAll: () => void }) {
  return (
    <Box px={{ base: 4, md: 8 }} minH={{base: '5rem', md: '7rem'}} mb={2}>
      <HStack justifyContent="space-between">
        <Heading size="lg" color="white">{title}</Heading>
        <Button
          color={COLORS.text.muted}
          bg={COLORS.background}
          fontWeight="bolder"
          fontSize="sm"
          onClick={onShowAll}
        >
          Show all
        </Button>
      </HStack>
      <Box mt={4} color={COLORS.text.muted}>
        No {title.toLowerCase()} to show.
      </Box>
    </Box>
  )
}

function HomePage() {
  const router = useRouter()
  const [myWishlists, setMyWishlists] = useState<Wishlist[]>([])
  const [friendsWishlists, setFriendsWishlists] = useState<Wishlist[]>([])
  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [myWishlistsData, friendsWishlistsData, claimedItemsData] = await Promise.all([
        wishlistAPI.getWishlists(),
        friendsAPI.getFriendsWishlists(),
        wishlistAPI.getClaimedItems()
      ])

      const transformedMyWishlists = myWishlistsData.map((wishlist: WishlistType) => ({
        id: wishlist.id,
        name: wishlist.title,
        image: wishlist.image,
        color: wishlist.color,
        thumbnail_type: wishlist.thumbnail_type,
        thumbnail_icon: wishlist.thumbnail_icon,
        thumbnail_image: wishlist.thumbnail_image,
        due_date: wishlist.due_date,
      }))

      const transformedFriendsWishlists = friendsWishlistsData
        .filter((wishlist: FriendWishlistResponse) => isWishlistActive(wishlist.due_date))
        .map((wishlist: FriendWishlistResponse) => ({
          id: wishlist.id,
          name: wishlist.title,
          ownerName: wishlist.owner_name || wishlist.owner_username,
          image: wishlist.image,
          color: wishlist.color,
          thumbnail_type: wishlist.thumbnail_type,
          thumbnail_icon: wishlist.thumbnail_icon,
          thumbnail_image: wishlist.thumbnail_image,
          due_date: wishlist.due_date,
        }))

      const transformedClaimedItems = claimedItemsData
        .filter((item: ClaimedItemResponse) => isWishlistActive(item.wishlist_due_date))
        .map((item: ClaimedItemResponse) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          owner_name: item.owner_name,
          color: item.wishlist_color,
          wishlist_id: item.wishlist_id,
          wishlist_due_date: item.wishlist_due_date,
        }))

      setMyWishlists(transformedMyWishlists)
      setFriendsWishlists(transformedFriendsWishlists)
      setClaimedItems(transformedClaimedItems)

    } catch (error) {
      console.error('Error loading data:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to load wishlists',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Box h="calc(100vh - 32px)" w="100%" display="flex" alignItems="center" justifyContent="center">
        {/* Add loading spinner here */}
      </Box>
    )
  }

  return (
    <Box h={{base: "calc(100vh + 80px)", md:"calc(100vh - 32px)"}} w="100%" overflowX="visible" bg={COLORS.background} py={2}>
      <ProfileHeader />
      <VStack align="stretch">
        {/* Claimed Items Section - shows full section if items exist, otherwise just the header with Show all */}
        {claimedItems.length > 0 ? (
          <ClaimedItemsSection
            items={claimedItems}
            onShowAll={() => router.push('/items/claimed')}
            onItemClick={(item) => router.push(`/wishlist/${item.wishlist_id}/${item.id}`)}
          />
        ) : (
          <EmptySectionHeader
            title="Items Claimed"
            onShowAll={() => router.push('/items/claimed')}
          />
        )}

        {/* Friends Wishlists - shows carousel if active items exist, otherwise just the header with Show all */}
        {friendsWishlists.length > 0 ? (
          <WishlistCarousel
            title="Friends Lists"
            wishlists={friendsWishlists}
            onShowAll={() => router.push('/wishlists/friends')}
            onWishlistClick={(id) => router.push(`/wishlist/${id}`)}
          />
        ) : (
          <EmptySectionHeader
            title="Friends Lists"
            onShowAll={() => router.push('/wishlists/friends')}
          />
        )}

        {/* My Wishlists Carousel - all, only show if there are wishlists */}
        {myWishlists.length > 0 && (
          <WishlistCarousel
            title="My Lists"
            wishlists={myWishlists}
            onShowAll={() => router.push('/wishlists/mine')}
            onWishlistClick={(id) => router.push(`/wishlist/${id}`)}
          />
        )}
      </VStack>
    </Box>
  )
}

export default HomePage