'use client'

import { Box, VStack, Heading, Text, IconButton, HStack, Image, Button } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { LuArrowLeft, LuEllipsisVertical, LuSettings } from 'react-icons/lu'
import { useEffect, useState } from 'react'
import { COLORS } from '../styles/common'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../services/api'
import { SizeCards } from '../components/profile/SizeCards'
import userAPI, { type PublicUserDetailsResponse } from '../services/user'
import { toaster } from '../components/ui/toaster'
import { friendsAPI, type FriendWishlistResponse } from '../services/friends'
import { WishlistCarousel } from '../components/home/WishlistCarousel'
import { EditSizesModal } from '../components/modals/EditSizesModal'

interface WishlistDisplayItem {
  id: string
  name: string
  ownerName: string
  image?: string
  color?: string
}

interface ProfilePageProps {
  userId?: string
}

function ProfilePage({ userId }: ProfilePageProps) {
  const router = useRouter()
  const { user, refreshUser, isLoggedIn } = useAuth()
  const [publicUser, setPublicUser] = useState<PublicUserDetailsResponse | null>(null)
  const [friendWishlists, setFriendWishlists] = useState<WishlistDisplayItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isEditSizesOpen, setIsEditSizesOpen] = useState(false)
  
  const isSelf = isLoggedIn && (!userId || userId === user?.id)
  
  useEffect(() => {
    if (isSelf) {
      refreshUser()
    } else if (userId) {
      loadPublicUser(userId)
      if (isLoggedIn) {
        loadFriendWishlists(userId)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isSelf, isLoggedIn])
  
  useEffect(() => {
    if (!loading && !isLoggedIn && !userId) {
      router.replace('/auth/login')
    }
  }, [loading, isLoggedIn, userId, router])

  const loadFriendWishlists = async (ownerId: string) => {
    try {
      const allWishlists = await friendsAPI.getFriendsWishlists()
      
      const ownerWishlists = allWishlists.filter((w: FriendWishlistResponse) => 
        w.owner_id === ownerId
      )
      
      const transformed: WishlistDisplayItem[] = ownerWishlists.map((w: FriendWishlistResponse) => ({
        id: w.id,
        name: w.title,
        ownerName: w.owner_name ?? w.owner_username ?? 'Unknown',
        image: w.image,
        color: w.color,
      }))
      
      setFriendWishlists(transformed)
    } catch (error) {
      console.error('Error loading friend wishlists:', error)
    }
  }

  const loadPublicUser = async (id: string) => {
    try {
      setLoading(true)
      const userData = await userAPI.getPublicUserDetails(id)
      setPublicUser(userData)
    } catch (error) {
      console.error('Error loading user profile:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to load user profile',
        type: 'error',
      })
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleSizesUpdated = async () => {
    await refreshUser()
  }

  if (!isLoggedIn && !userId) {
    return null
  }

  if (loading || (!isSelf && !publicUser)) {
    return (
      <Box h="calc(100vh - 32px)" w="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">Loading...</Text>
      </Box>
    )
  }

  if (!isSelf && !publicUser) {
    return (
      <Box h="calc(100vh - 32px)" w="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">User not found</Text>
      </Box>
    )
  }

  const target = isSelf ? user : publicUser
  
  if (!target) {
    return (
      <Box h="calc(100vh - 32px)" w="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">Loading...</Text>
      </Box>
    )
  }

  const profileImage = target.id ? `${API_URL}users/${target.id}/profile-image` : null
  const displayName = target.name || target.username

  const sizeValues = {
    shoe_size: target.shoe_size ?? undefined,
    shirt_size: target.shirt_size ?? undefined,
    pants_size: target.pants_size ?? undefined,
    hat_size: target.hat_size ?? undefined,
    ring_size: target.ring_size ?? undefined,
    dress_size: target.dress_size ?? undefined,
    jacket_size: target.jacket_size ?? undefined,
  }

  const hasSizes = Object.values(sizeValues).some(value => value)

  return (
    <Box h="calc(100vh - 32px)" w="100%" overflowY="auto" bg={COLORS.background}>
      {/* Header */}
      <Box bg={COLORS.background} px={8} py={4} position="sticky" top={0} zIndex={10}>
        <HStack justify="space-between">
          <IconButton
            aria-label="Go back"
            variant="ghost"
            onClick={() => router.back()}
            color="white"
            size="lg"
          >
            <LuArrowLeft />
          </IconButton>

          {isSelf && (
            <IconButton
              aria-label="Settings"
              variant="ghost"
              onClick={() => router.push('/settings')}
              color="white"
              size="lg"
            >
              <LuSettings />
            </IconButton>
          )}

          {!isSelf && (
            <IconButton
              aria-label="Settings"
              variant="ghost"
              onClick={() => console.log('/settings')}
              color="white"
              size="lg"
            >
              <LuEllipsisVertical />
            </IconButton>
          )} 
        </HStack>
      </Box>

      {/* Profile Content */}
      <VStack gap={6} align="stretch">
        <Box gap={6} px={8} py={8}>
          {/* Profile Image and User Info */}
          <VStack gap={4}>
            <Box
              w="120px"
              h="120px"
              borderRadius="full"
              overflow="hidden"
              bg={COLORS.cardGray}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={displayName}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              ) : (
                <Text color={COLORS.text.secondary} fontSize="4xl" fontWeight="bold">
                  {displayName?.charAt(0).toUpperCase() || '?'}
                </Text>
              )}
            </Box>

            <VStack gap={1}>
              <Heading size="xl" color="white">
                {displayName}
              </Heading>
              <Text color={COLORS.text.secondary} fontSize="lg">
                @{target.username}
              </Text>
            </VStack>
          </VStack>

          {/* Sizes Section */}
          {(hasSizes || isSelf) && (
            <Box mt={6}>
              <HStack justify="space-between" align="center" mb={3}>
                <Text fontSize="lg" fontWeight="semibold" color="white">
                  Sizes
                </Text>
                {isSelf && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditSizesOpen(true)}
                  >
                    Edit Sizes
                  </Button>
                )}
              </HStack>
              {hasSizes ? (
                <SizeCards values={sizeValues} />
              ) : (
                <Text color={COLORS.text.secondary} fontSize="sm">
                  No sizes added yet. Click "Edit Sizes" to add your size preferences.
                </Text>
              )}
            </Box>
          )}
        </Box>

        {!isSelf && friendWishlists.length > 0 && (
          <Box>
            <WishlistCarousel 
              title="Saved Lists"
              wishlists={friendWishlists}
              onWishlistClick={(id) => router.push(`/wishlist/${id}`)}
            />
          </Box>
        )}
      </VStack>

      {isSelf && user && (
        <EditSizesModal
          isOpen={isEditSizesOpen}
          onClose={() => setIsEditSizesOpen(false)}
          userId={user.id}
          initialValues={sizeValues}
          onSuccess={handleSizesUpdated}
        />
      )}
    </Box>
  )
}

export default ProfilePage
