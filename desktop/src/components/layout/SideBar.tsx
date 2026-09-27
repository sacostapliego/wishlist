'use client'

import { Box, VStack, Text, Separator } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { LuHouse, LuPlus, LuUsers, LuHeart, LuGift, LuX } from 'react-icons/lu'
import { useEffect, useState, useRef, useMemo } from 'react'
import { wishlistAPI } from '../../services/wishlist'
import { friendsAPI, type FriendWishlistResponse } from '../../services/friends'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../services/api'
import { toaster } from '../ui/toaster'
import { COLORS } from '../../styles/common'
import { isWishlistActive, isWishlistCurrent } from '../../utils/wishlistUtils'
import { ProfileSection } from './sidebar/ProfileSection'
import { WishlistItem } from './sidebar/WishlistItem'
import { FriendWishlistItem } from './sidebar/FriendWishlistItem'
import { SidebarRow, SIDEBAR_ROW_PX } from './sidebar/SidebarRow'
import { CreateMenu } from './sidebar/CreateMenu'
import { CreateWishlistModal } from '../wishlists/CreateWishlistModal'
import { AddItemModal } from '../items/AddItemModal'

/** Matches the row label timing, so headings and labels clear together. */
const HEADING_TRANSITION = 'opacity 150ms ease, max-height 200ms ease, margin-bottom 200ms ease'

interface Wishlist {
  id: string
  title: string
  color?: string
  image?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
  due_date?: string | null
}

interface SidebarProps {
  isExpanded: boolean
  isCollapsed: boolean
  isHidden: boolean
  onToggle: () => void
}

/**
 * Section heading that collapses to nothing instead of unmounting, so the rows
 * beneath it slide up rather than jumping when the rail narrows.
 */
function SectionHeading({ label, isExpanded }: { label: string; isExpanded: boolean }) {
  return (
    <Box
      overflow="hidden"
      opacity={isExpanded ? 1 : 0}
      maxH={isExpanded ? '1.5rem' : '0'}
      mb={isExpanded ? 2 : 0}
      transition={HEADING_TRANSITION}
      aria-hidden={!isExpanded}
    >
      <Text fontSize="sm" fontWeight="semibold" px={SIDEBAR_ROW_PX} color={COLORS.text.muted}>
        {label}
      </Text>
    </Box>
  )
}

export default function Sidebar({ isExpanded, isCollapsed, isHidden }: SidebarProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [myWishlists, setMyWishlists] = useState<Wishlist[]>([])
  const [friendsWishlists, setFriendsWishlists] = useState<FriendWishlistResponse[]>([])
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [isCreateWishlistModalOpen, setIsCreateWishlistModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const createButtonRef = useRef<HTMLButtonElement | null>(null)

  const loadWishlists = async () => {
    try {
      const [mine, friends] = await Promise.all([
        wishlistAPI.getWishlists(),
        friendsAPI.getFriendsWishlists()
      ])
      setMyWishlists(mine)
      setFriendsWishlists(friends)
    } catch (error) {
      console.error('Error loading wishlists:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to load wishlists',
        type: 'error',
      })
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadWishlists()
  }, [])

  /**
   * Same split as the home page: your own undated lists are ones you're still
   * building toward, so they stay; a friend's undated list gives you no occasion
   * to buy for, so it doesn't. Past dates are dropped from both — they remain on
   * /wishlists/mine and /wishlists/friends.
   */
  const visibleWishlists = useMemo(
    () => myWishlists.filter((wishlist) => isWishlistCurrent(wishlist.due_date)),
    [myWishlists]
  )

  const visibleFriendsWishlists = useMemo(
    () => friendsWishlists.filter((wishlist) => isWishlistActive(wishlist.due_date)),
    [friendsWishlists]
  )

  const handleCreateWishlistSuccess = () => {
    loadWishlists()
  }

  const handleOpenAddItem = () => {
    setIsCreateMenuOpen(false)
    setIsAddItemModalOpen(true)
  }

  const handleOpenCreateWishlist = () => {
    setIsCreateMenuOpen(false)
    setIsCreateWishlistModalOpen(true)
  }

  if (isHidden) return null

  const profileImage = user?.id ? `${API_URL}users/${user.id}/profile-image` : null
  const displayName = user?.name || user?.username || 'Guest'

  return (
    <Box
      bg="#141414"
      h="100%"
      overflowY="auto"
      // Constant padding: it used to shrink with the rail, which shifted every
      // icon sideways on top of the width change.
      p={3}
      overflowX="hidden"
      display="flex"
      flexDirection="column"
    >
      <Box mb={4}>
        <ProfileSection
          displayName={displayName}
          profileImage={profileImage}
          isExpanded={isExpanded}
          onNavigate={() => router.push('/profile')}
        />
      </Box>

      <Separator mb={4} />

      <VStack align="stretch" gap={4} flex="1">
        {/* Top Buttons */}
        <VStack align="stretch" gap={1}>
          <SidebarRow
            icon={<LuHouse size={20} />}
            label="Home"
            isExpanded={isExpanded}
            onClick={() => router.push('/')}
          />
          <SidebarRow
            buttonRef={createButtonRef}
            icon={
              <Box
                transition="transform 300ms ease"
                transform={isCreateMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {isCreateMenuOpen ? <LuX size={20} /> : <LuPlus size={20} />}
              </Box>
            }
            label="Create"
            isExpanded={isExpanded}
            onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
          />
          <SidebarRow
            icon={<LuUsers size={20} />}
            label="Friends"
            isExpanded={isExpanded}
            onClick={() => router.push('/friends')}
          />
        </VStack>

        <Separator />

        {/* My Wishlists */}
        <Box>
          <SectionHeading label="My Wishlists" isExpanded={isExpanded} />
          <VStack align="stretch" gap={1}>
            {visibleWishlists.length === 0 ? (
              <SidebarRow
                icon={<LuGift size={20} />}
                label="No wishlists yet"
                isExpanded={isExpanded}
                isMuted
              />
            ) : (
              visibleWishlists.map((wishlist) => (
                <WishlistItem
                  key={wishlist.id}
                  {...wishlist}
                  isCollapsed={!isExpanded}
                  onClick={() => router.push(`/wishlist/${wishlist.id}`)}
                />
              ))
            )}
          </VStack>
        </Box>

        <Separator />

        {/* Friends' Wishlists */}
        <Box>
          <SectionHeading label="Friends' Wishlists" isExpanded={isExpanded} />
          <VStack align="stretch" gap={1}>
            {visibleFriendsWishlists.length === 0 ? (
              <SidebarRow
                icon={<LuHeart size={20} />}
                label="No friends' wishlists"
                isExpanded={isExpanded}
                isMuted
              />
            ) : (
              visibleFriendsWishlists.map((wishlist) => (
                <FriendWishlistItem
                  key={wishlist.id}
                  id={wishlist.id}
                  title={wishlist.title}
                  ownerName={wishlist.owner_name || wishlist.owner_username}
                  color={wishlist.color}
                  image={wishlist.image}
                  thumbnail_type={wishlist.thumbnail_type}
                  thumbnail_icon={wishlist.thumbnail_icon}
                  thumbnail_image={wishlist.thumbnail_image}
                  isCollapsed={!isExpanded}
                  onClick={() => router.push(`/wishlist/${wishlist.id}`)}
                />
              ))
            )}
          </VStack>
        </Box>
      </VStack>

      <CreateMenu
        isOpen={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
        anchorRef={createButtonRef}
        onCreateWishlist={handleOpenCreateWishlist}
        onAddItem={handleOpenAddItem}
      />

      <CreateWishlistModal
        isOpen={isCreateWishlistModalOpen}
        onClose={() => setIsCreateWishlistModalOpen(false)}
        onSuccess={handleCreateWishlistSuccess}
      />

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onSuccess={loadWishlists}
      />

    </Box>
  )
}
