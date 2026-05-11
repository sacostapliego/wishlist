'use client'

import { Box, HStack, VStack, Heading, Text, Avatar, IconButton } from '@chakra-ui/react'
import { LuArrowLeft, LuEllipsisVertical } from 'react-icons/lu'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { COLORS } from '../../styles/common'
import { API_URL } from '../../services/api'
import { WishlistMenu, getSharedMenuOptions } from './WishlistMenu'
import { friendsAPI } from '../../services/friends'
import { useAuth } from '../../context/AuthContext'
import { toaster } from '../ui/toaster'
import { WishlistThumbnail } from './WishlistThumbnail'

interface SharedWishlistViewProps {
  wishlist: {
    id: string
    title: string
    owner_name: string
    owner_id: string
    description?: string
    color?: string
    image?: string
    thumbnail_type?: 'icon' | 'image'
    thumbnail_icon?: string | null
    thumbnail_image?: string | null
    item_count?: number
    updated_at?: string
    created_at?: string
    due_date?: string | null
  }
}

export function SharedWishlistView({ wishlist }: SharedWishlistViewProps) {
  const router = useRouter()
  const { user, isLoggedIn } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFriend, setIsFriend] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const profileImage = wishlist.owner_id ? `${API_URL}users/${wishlist.owner_id}/profile-image` : null

  useEffect(() => {
    checkRelationship()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlist.id, wishlist.owner_id, user?.id, isLoggedIn])

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const checkRelationship = async () => {
    // Skip relationship checks for guests
    if (!isLoggedIn || !wishlist?.owner_id || !user?.id) {
      setLoading(false)
      return
    }

    // Don't show add friend for own wishlist
    if (wishlist.owner_id === user.id) {
      setIsFriend(true)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Check friendship status using friends list (more reliable than wishlists - friends with no wishlists would be missed)
      const friendsList = await friendsAPI.getFriendsList()
      const isAlreadyFriend = friendsList.some(f => f.id === wishlist.owner_id)
      setIsFriend(isAlreadyFriend)

      // Check if wishlist is saved
      try {
        const savedStatus = await friendsAPI.checkWishlistSaved(wishlist.id)
        setIsSaved(savedStatus.is_saved)
      } catch (error) {
        console.error('Error checking saved status:', error)
        setIsSaved(false)
      }
    } catch (error) {
      console.error('Error checking friendship status:', error)
      setIsFriend(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFriend = async () => {
    if (!wishlist.owner_id) return
    try {
      await friendsAPI.sendFriendRequest(wishlist.owner_id)
      setIsFriend(true)
      setIsMenuOpen(false)
      toaster.create({
        title: 'Success',
        description: 'Friend request sent!',
        type: 'success',
      })
    } catch (error) {
      toaster.create({
        title: 'Error',
        description: 'Failed to send friend request',
        type: 'error',
      })
    }
  }

  const handleSaveWishlist = async () => {
    try {
      await friendsAPI.saveWishlist(wishlist.id)
      setIsSaved(true)
      setIsMenuOpen(false)
      toaster.create({
        title: 'Success',
        description: 'Wishlist saved!',
        type: 'success',
      })
    } catch (error) {
      toaster.create({
        title: 'Error',
        description: 'Failed to save wishlist',
        type: 'error',
      })
    }
  }

  const handleRemoveSaved = async () => {
    try {
      await friendsAPI.unsaveWishlist(wishlist.id)
      setIsSaved(false)
      setIsMenuOpen(false)
      toaster.create({
        title: 'Success',
        description: 'Wishlist removed from saved',
        type: 'success',
      })
    } catch (error) {
      toaster.create({
        title: 'Error',
        description: 'Failed to remove saved wishlist',
        type: 'error',
      })
    }
  }

  const menuOptions = isLoggedIn 
    ? getSharedMenuOptions({
        onAddFriend: !isFriend ? handleAddFriend : undefined,
        onSaveWishlist: !isSaved ? handleSaveWishlist : undefined,
        onRemoveSaved: isSaved ? handleRemoveSaved : undefined,
      })
    : getSharedMenuOptions({
        onCreateAccount: () => router.push('/auth/register'),
        onSignIn: () => router.push('/auth/login'),
      })

  return (
    <Box bg={wishlist.color || COLORS.cardGray} px={{base:4, md:6}} py={{base:4, md:6}}>
      {/* Header with back button and menu */}
      <HStack justify="space-between" mb={4}>
        <IconButton
          aria-label="Go back"
          variant="ghost"
          onClick={() => router.back()}
          color="white"
          size="lg"
        >
          <LuArrowLeft />
        </IconButton>

        <IconButton
          aria-label="Menu"
          variant="ghost"
          onClick={() => setIsMenuOpen(true)}
          color="white"
          size="lg"
          disabled={loading}
        >
          <LuEllipsisVertical />
        </IconButton>
      </HStack>

      <HStack align="flex-end" gap={6}>
        {/* Wishlist Icon */}
        <WishlistThumbnail
          wishlist={wishlist}
          boxSize={{ base: "9rem", md: "13rem", lg: "15rem", '2xl': "17rem" }}
          iconSize={{ base: "5rem", md: "6rem", lg: "8rem", '2xl': "10rem" }}
          sx={{ boxShadow: '0 4px 60px rgba(0,0,0,0.5)' }}
          showBackground={false}
        />

        {/* Wishlist Info */}
        <VStack align="start" gap={2} pb={4}>
          <Heading 
            size={{ base: "xl", md: "3xl", lg: "4xl" }} 
            color="white"
            lineHeight="1.2"
            wordBreak="break-word"
          >
            {wishlist.title}
          </Heading>
          
          {wishlist.description && (
            <Text color={COLORS.text.secondary} fontSize="sm" mt={2} lineClamp={1}>
              {wishlist.description}
            </Text>
          )}

          <HStack gap={2} color={COLORS.text.secondary} fontSize="sm" mt={2}>
            <Avatar.Root 
              size="xs"
              cursor="pointer"
              onClick={() => router.push(`/profile/${wishlist.owner_id}`)}
            >
              <Avatar.Fallback name={wishlist.owner_name} />
              <Avatar.Image src={profileImage || undefined} />
            </Avatar.Root>
            <Text fontWeight="semibold" color="white" cursor="pointer" onClick={() => router.push(`/profile/${wishlist.owner_id}`)}>
              {wishlist.owner_name}
            </Text>
            <Text display={{ base: 'none', md: 'block' }}>•</Text>
            <Text display={{ base: 'none', md: 'block' }}>
              {wishlist.item_count || 0} {wishlist.item_count === 1 ? 'item' : 'items'}
            </Text>
            {wishlist.due_date && (
              <>
                <Text display={{ base: 'none', md: 'block' }}>•</Text>
                <Text display={{ base: 'none', md: 'block' }}>{formatDueDate(wishlist.due_date)}</Text>
              </>
            )}
          </HStack>
        </VStack>
      </HStack>

      <WishlistMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        options={menuOptions}
      />
    </Box>
  )
}