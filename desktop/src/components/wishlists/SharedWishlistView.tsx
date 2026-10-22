'use client'

import { Box, HStack, VStack, Stack, Heading, Text, Avatar, IconButton } from '@chakra-ui/react'
import { LuArrowLeft, LuEllipsisVertical } from 'react-icons/lu'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { COLORS } from '../../styles/common'
import { API_URL } from '../../services/api'
import { WishlistMenu, getSharedMenuOptions } from './WishlistMenu'
import { friendsAPI } from '../../services/friends'
import { useAuth } from '../../context/AuthContext'
import { toaster } from '../ui/toaster'
import { WishlistThumbnail } from './WishlistThumbnail'
import getLightColor from '../common/getLightColor'
import getFadeGradient from '../common/getFadeGradient'
import { DueBadge, hasDueCountdown } from '../common/DueBadge'
import { OpenListNotice } from './OpenListNotice'
import type { WishlistVisibility } from '../../types/types'
import { useBackNavigation } from '../../hooks/useBackNavigation'

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
    demo_thumbnail_url?: string | null
    item_count?: number
    updated_at?: string
    created_at?: string
    due_date?: string | null
    visibility_mode?: WishlistVisibility
  }
  demoMode?: boolean
  onDemoBack?: () => void
  compactHeader?: boolean
}

export function SharedWishlistView({
  wishlist,
  demoMode = false,
  onDemoBack,
  compactHeader = false,
}: SharedWishlistViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoggedIn } = useAuth()
  // A guest who opened a shared link has nowhere in the app to go back to
  const back = useBackNavigation(isLoggedIn ? '/wishlists/friends' : null)
  const showBack = Boolean(onDemoBack) || back.canGoBack
  const handleBack = () => (onDemoBack ? onDemoBack() : back.goBack())
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFriend, setIsFriend] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const profileImage =
    demoMode || !wishlist.owner_id ? null : `${API_URL}users/${wishlist.owner_id}/profile-image`

  /*
    Phone (full header only): Apple Music album layout — artwork stacked over
    centred title, owner and a metadata line, each a step smaller. The compact
    demo header keeps its side-by-side row at every width.
  */
  const r = <T,>(phone: T, desktop: T) => (compactHeader ? desktop : { base: phone, md: desktop })

  const thumbBox = compactHeader
    ? ({ base: '4rem', md: '5.5rem', lg: '6rem', '2xl': '7rem' } as Record<string, string>)
    : { base: 'min(54vw, 13.5rem)', md: '13rem', lg: '15rem', '2xl': '17rem' }
  const thumbIcon = compactHeader
    ? ({ base: '2.25rem', md: '2.75rem', lg: '3rem', '2xl': '3.25rem' } as Record<string, string>)
    : { base: '5.75rem', md: '6rem', lg: '8rem', '2xl': '10rem' }
  const titleSize = compactHeader
    ? ({ base: 'lg' as const, md: 'xl' as const, lg: '2xl' as const })
    : ({ base: '2xl' as const, md: '3xl' as const, lg: '4xl' as const })
  const headerColor = wishlist.color || COLORS.cardGray
  // Phone: fade the list colour into the page, as Apple Music does under an album
  const headerBg = r(getFadeGradient(headerColor), headerColor)
  // Phone: owner name a step down from the title's pure white
  const ownerNameColor = r('rgba(255, 255, 255, 0.85)', 'white')
  const iconButtonSize = r('md' as const, compactHeader ? 'md' as const : 'lg' as const)

  useEffect(() => {
    if (demoMode) {
      setLoading(false)
      return
    }
    checkRelationship()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlist.id, wishlist.owner_id, user?.id, isLoggedIn, demoMode])

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
        onCreateAccount: () => router.push(`/auth/register?next=${encodeURIComponent(pathname)}`),
        onSignIn: () => router.push(`/auth/login?next=${encodeURIComponent(pathname)}`),
      })

  return (
    <Box
      bg={headerBg}
      px={compactHeader ? 3 : { base: 4, md: 6 }}
      /* The layout already insets the phone status bar, so the top needs little more */
      pt={r(1, compactHeader ? 3 : 6)}
      pb={r(4, compactHeader ? 3 : 6)}
    >
      {/* Header with back button and menu */}
      <HStack justify="space-between" mb={r(2, compactHeader ? 2 : 4)}>
        <IconButton
          aria-label="Go back"
          variant="ghost"
          onClick={handleBack}
          color="white"
          size={iconButtonSize}
          /* hidden, not removed, so the menu button keeps its place on the right */
          visibility={showBack ? 'visible' : 'hidden'}
        >
          <LuArrowLeft />
        </IconButton>

        {!demoMode && (
          <IconButton
            aria-label="Menu"
            variant="ghost"
            onClick={() => setIsMenuOpen(true)}
            color="white"
            size={iconButtonSize}
            disabled={loading}
          >
            <LuEllipsisVertical />
          </IconButton>
        )}
      </HStack>

      <Stack
        direction={r('column', 'row')}
        align={r('center', 'flex-end')}
        gap={r(4, compactHeader ? 4 : 6)}
      >
        {/* Wishlist Icon */}
        <WishlistThumbnail
          wishlist={wishlist}
          boxSize={thumbBox}
          iconSize={thumbIcon}
          sx={{ boxShadow: '0 4px 60px rgba(0,0,0,0.5)' }}
          showBackground={false}
        />

        {/* Wishlist Info */}
        <VStack
          align={r('center', 'start')}
          textAlign={r('center', 'start')}
          gap={r(1, compactHeader ? 1 : 2)}
          pb={r(0, compactHeader ? 2 : 4)}
        >
          <Heading size={titleSize} color="white" lineHeight="1.2" wordBreak="break-word">
            {wishlist.title}
          </Heading>

          {wishlist.description && (
            <Text display={r('none', 'block')} color={COLORS.text.secondary} fontSize={compactHeader ? 'xs' : 'sm'} mt={compactHeader ? 0 : 2} lineClamp={1}>
              {wishlist.description}
            </Text>
          )}

          <HStack gap={2} color={COLORS.text.secondary} fontSize={r('md', compactHeader ? 'xs' : 'sm')} mt={r(0, compactHeader ? 0 : 2)}>
            {!demoMode && (
              <Avatar.Root
                size="xs"
                display={r('none', 'inline-flex')}
                cursor="pointer"
                onClick={() => router.push(`/profile/${wishlist.owner_id}`)}
              >
                <Avatar.Fallback name={wishlist.owner_name} />
                <Avatar.Image src={profileImage || undefined} />
              </Avatar.Root>
            )}
            <Text
              fontWeight="semibold"
              color={ownerNameColor}
              cursor="pointer"
              onClick={() => (demoMode ? router.push('/auth/login') : router.push(`/profile/${wishlist.owner_id}`))}
            >
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

          {/* Phone metadata line — the desktop folds this into the owner row */}
          {!compactHeader && (
            <HStack display={{ base: 'flex', md: 'none' }} gap={1.5} color={COLORS.text.secondary} fontSize="xs">
              <Text>
                {wishlist.item_count || 0} {wishlist.item_count === 1 ? 'item' : 'items'}
              </Text>
              {hasDueCountdown(wishlist.due_date) && (
                <>
                  <Text>•</Text>
                  <DueBadge due_date={wishlist.due_date} size="md" />
                </>
              )}
            </HStack>
          )}

          {!compactHeader && wishlist.description && (
            <Text display={{ base: 'block', md: 'none' }} color={COLORS.text.secondary} fontSize="xs" lineClamp={2} mt={1}>
              {wishlist.description}
            </Text>
          )}
        </VStack>
      </Stack>

      {/* Visitors are told the owner can see claims before they claim anything.
          A portalled dialog, so its position in the tree is immaterial. */}
      {!demoMode && (
        <OpenListNotice
          wishlistId={wishlist.id}
          ownerName={wishlist.owner_name}
          isOwner={wishlist.owner_id === user?.id}
          visibilityMode={wishlist.visibility_mode}
        />
      )}

      {!demoMode && <WishlistMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} options={menuOptions} />}
    </Box>
  )
}