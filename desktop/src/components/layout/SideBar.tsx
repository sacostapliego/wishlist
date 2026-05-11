'use client'

import { Box, VStack, Text, Button, Separator, IconButton, HStack } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { LuHouse, LuPlus, LuUsers, LuHeart, LuGift, LuX } from 'react-icons/lu'
import { useEffect, useState, useRef } from 'react'
import { wishlistAPI } from '../../services/wishlist'
import { friendsAPI, type FriendWishlistResponse } from '../../services/friends'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../services/api'
import { toaster } from '../ui/toaster'
import { COLORS } from '../../styles/common'
import { ProfileSection } from './sidebar/ProfileSection'
import { WishlistItem } from './sidebar/WishlistItem'
import { FriendWishlistItem } from './sidebar/FriendWishlistItem'
import { CreateMenu } from './sidebar/CreateMenu'
import { CreateWishlistModal } from '../wishlists/CreateWishlistModal'
import { AddItemModal } from '../items/AddItemModal'

interface Wishlist {
  id: string
  title: string
  color?: string
  image?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
}

interface SidebarProps {
  isExpanded: boolean
  isCollapsed: boolean
  isHidden: boolean
  onToggle: () => void
}

export default function Sidebar({ isExpanded, isCollapsed, isHidden }: SidebarProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [myWishlists, setMyWishlists] = useState<Wishlist[]>([])
  const [friendsWishlists, setFriendsWishlists] = useState<FriendWishlistResponse[]>([])
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [isCreateWishlistModalOpen, setIsCreateWishlistModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const createButtonRef = useRef<HTMLButtonElement>(null)

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
      p={isCollapsed ? 3 : 4}
      transition="all 0.2s"
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
        <VStack align="stretch" gap={2}>
          {isExpanded ? (
            <>
              <Button variant="ghost" justifyContent="flex-start" onClick={() => router.push('/')}>
                <HStack><LuHouse /><Text>Home</Text></HStack>
              </Button>
              <Button 
                ref={createButtonRef}
                variant="ghost" 
                justifyContent="flex-start" 
                onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              >
                <HStack>
                  <Box
                    transition="transform 300ms ease"
                    transform={isCreateMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isCreateMenuOpen ? <LuX /> : <LuPlus />}
                  </Box>
                  <Text>Create</Text>
                </HStack>
              </Button>
              <Button variant="ghost" justifyContent="flex-start" onClick={() => router.push('/friends')}>
                <HStack><LuUsers /><Text>Friends</Text></HStack>
              </Button>
            </>
          ) : (
            <>
              <IconButton aria-label="Home" variant="ghost" onClick={() => router.push('/')}><LuHouse /></IconButton>
              <IconButton 
                ref={createButtonRef}
                aria-label="Create" 
                variant="ghost" 
                onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              >
                <Box
                  transition="transform 300ms ease"
                  transform={isCreateMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {isCreateMenuOpen ? <LuX /> : <LuPlus />}
                </Box>
              </IconButton>
              <IconButton aria-label="Friends" variant="ghost" onClick={() => router.push('/friends')}><LuUsers /></IconButton>
            </>
          )}
        </VStack>

        <Separator />

        {/* My Wishlists */}
        <Box>
          {isExpanded && (
            <Text fontSize="sm" fontWeight="semibold" mb={2} px={2} color={COLORS.text.muted}>
              My Wishlists
            </Text>
          )}
          <VStack align="stretch" gap={4}>
            {myWishlists.length === 0 ? (
              isExpanded ? (
                <Text fontSize="xs" color={COLORS.text.muted} px={2}>No wishlists yet</Text>
              ) : (
                <IconButton aria-label="My Wishlists" variant="ghost" w="100%"><LuGift /></IconButton>
              )
            ) : (
              myWishlists.map((wishlist) => (
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
          {isExpanded && (
            <Text fontSize="sm" fontWeight="semibold" mb={2} px={2} color={COLORS.text.muted}>
              Friends' Wishlists
            </Text>
          )}
          <VStack align="stretch" gap={4}>
            {friendsWishlists.length === 0 ? (
              isExpanded ? (
                <Text fontSize="xs" color={COLORS.text.muted} px={2}>No friends' wishlists</Text>
              ) : (
                <IconButton aria-label="Friends' Wishlists" variant="ghost" w="100%"><LuHeart /></IconButton>
              )
            ) : (
              friendsWishlists.map((wishlist) => (
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