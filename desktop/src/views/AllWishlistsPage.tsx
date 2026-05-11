'use client'

import { Box, HStack, VStack, Heading, Text, IconButton, SimpleGrid, Image } from '@chakra-ui/react'
import { LuArrowLeft } from 'react-icons/lu'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { wishlistAPI } from '../services/wishlist'
import { friendsAPI } from '../services/friends'
import { resolveWishlistThumbnail } from '../utils/wishlistIcons'
import { isWishlistActive } from '../utils/wishlistUtils'
import { COLORS } from '../styles/common'
import type { Wishlist as WishlistType, FriendWishlist as FriendWishlistType } from '../types/types'

interface Wishlist {
  id: string
  name: string
  image?: string
  color?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
  ownerName?: string
  due_date?: string | null
}

interface AllWishlistsPageProps {
  type: 'friends' | 'mine'
}

interface WishlistGridProps {
  wishlists: Wishlist[]
  type: 'friends' | 'mine'
  onNavigate: (id: string) => void
}

function WishlistGrid({ wishlists, type, onNavigate }: WishlistGridProps) {
  if (wishlists.length === 0) return null

  return (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} gap={{ base: 0, md: 6 }}>
      {wishlists.map((wishlist) => {
        const thumbnail = resolveWishlistThumbnail(wishlist)
        return (
          <Box
            key={wishlist.id}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ bg: '#2a2a2a' }}
            onClick={() => onNavigate(wishlist.id)}
            borderRadius="md"
            p={4}
          >
            <VStack gap={3} align="stretch">
              <Box
                w="100%"
                aspectRatio={1}
                overflow="hidden"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={wishlist.color || COLORS.cardGray}
              >
                {thumbnail.type === 'image' ? (
                  <Image src={thumbnail.url} alt={wishlist.name} w="100%" h="100%" objectFit="cover" />
                ) : (
                  <Box as={thumbnail.icon} boxSize={{ base: "5rem", md: "7rem", lg: "9rem", xl: "11rem" }} color="white" />
                )}
              </Box>
              <VStack gap={0} align="start">
                <Text color="white" fontWeight="semibold" fontSize="md" lineClamp={{ base: 1, md: 2 }}>
                  {wishlist.name}
                </Text>
                {type === 'friends' && wishlist.ownerName && (
                  <Text color={COLORS.text.secondary} fontSize="sm" lineClamp={{ base: 1, md: 2 }}>
                    {wishlist.ownerName}
                  </Text>
                )}
              </VStack>
            </VStack>
          </Box>
        )
      })}
    </SimpleGrid>
  )
}

function AllWishlistsPage({ type }: AllWishlistsPageProps) {
  const router = useRouter()
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [loading, setLoading] = useState(true)

  const title = type === 'friends' ? "Friends' Wishlists" : "My Wishlists"

  useEffect(() => {
    loadWishlists()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const loadWishlists = async () => {
    try {
      setLoading(true)
      if (type === 'friends') {
        const data = await friendsAPI.getFriendsWishlists()
        const transformed = data.map((w: FriendWishlistType) => ({
          id: w.id,
          name: w.title,
          ownerName: w.owner_name || w.owner_username,
          image: w.image,
          color: w.color,
          thumbnail_type: w.thumbnail_type,
          thumbnail_icon: w.thumbnail_icon,
          thumbnail_image: w.thumbnail_image,
          due_date: w.due_date,
        }))
        setWishlists(transformed)
      } else {
        const data = await wishlistAPI.getWishlists()
        const transformed = data.map((w: WishlistType) => ({
          id: w.id,
          name: w.title,
          image: w.image,
          color: w.color,
          thumbnail_type: w.thumbnail_type,
          thumbnail_icon: w.thumbnail_icon,
          thumbnail_image: w.thumbnail_image,
          due_date: w.due_date,
        }))
        setWishlists(transformed)
      }
    } catch (error) {
      console.error('Error loading wishlists:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeWishlists = wishlists.filter(w => isWishlistActive(w.due_date))
  const inactiveWishlists = wishlists.filter(w => !isWishlistActive(w.due_date))

  if (loading) {
    return (
      <Box h={{ base: "calc(100vh + 80px)", md: "calc(100vh - 32px)" }} w="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">Loading...</Text>
      </Box>
    )
  }

  return (
    <Box h={{ base: "calc(100vh + 80px)", md: "calc(100vh - 32px)" }} w="100%" overflowY="auto" overflowX="hidden">
      {/* Header */}
      <Box bg={COLORS.background} px={8} py={4} position="sticky" top={0} zIndex={10}>
        <HStack gap={4}>
          <IconButton
            aria-label="Go back"
            variant="ghost"
            onClick={() => router.back()}
            color="white"
            size="lg"
          >
            <LuArrowLeft />
          </IconButton>
          <Heading size="xl" color="white">{title}</Heading>
        </HStack>
      </Box>

      <Box px={{ base: 4, md: 8 }} py={{ base: 4, md: 6 }}>
        {wishlists.length === 0 ? (
          <Text color="gray.400">No wishlists found</Text>
        ) : (
          <VStack align="stretch" gap={8}>
            {/* Active Section */}
            <Box>
              <Heading size="md" color="white" mb={4}>Active</Heading>
              {activeWishlists.length === 0 ? (
                <Text color={COLORS.text.secondary} fontSize="sm">No active wishlists</Text>
              ) : (
                <WishlistGrid wishlists={activeWishlists} type={type} onNavigate={(id) => router.push(`/wishlist/${id}`)} />
              )}
            </Box>

            {/* Inactive Section */}
            <Box>
              <Heading size="md" color="white" mb={4}>Inactive</Heading>
              {inactiveWishlists.length === 0 ? (
                <Text color={COLORS.text.secondary} fontSize="sm">No inactive wishlists</Text>
              ) : (
                <WishlistGrid wishlists={inactiveWishlists} type={type} onNavigate={(id) => router.push(`/wishlist/${id}`)} />
              )}
            </Box>
          </VStack>
        )}
      </Box>
    </Box>
  )
}

export default AllWishlistsPage