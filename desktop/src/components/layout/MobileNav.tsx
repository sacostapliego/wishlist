'use client'

import { Avatar, Box, Flex, Text } from '@chakra-ui/react'
import type { IconType } from 'react-icons'
import { LuPlus, LuX } from 'react-icons/lu'
import { GoHome, GoHomeFill } from 'react-icons/go'
import { PiListBullets, PiListBulletsBold, PiUsers, PiUsersFill } from 'react-icons/pi'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { COLORS } from '../../styles/common'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../services/api'
import { friendsAPI } from '../../services/friends'
import { MobileCreateMenu } from './nav/MobileCreateMenu'
import { CreateWishlistModal } from '../wishlists/CreateWishlistModal'
import { AddItemModal } from '../items/AddItemModal'

/** Height of the bar's touch area, above the home-indicator inset. Things that sit on top of the bar offset by this. */
export const MOBILE_NAV_HEIGHT = '54px'

type Tab = 'home' | 'lists' | 'friends' | 'you'

/**
 * Which tab a route belongs to, so the bar stays lit on the pages a tab leads
 * to — an open list keeps Lists lit, a friend's profile keeps Friends lit.
 */
function tabFor(pathname: string, userId: string | undefined): Tab | null {
  if (pathname === '/' || pathname.startsWith('/items/claimed')) return 'home'
  if (pathname.startsWith('/wishlist')) return 'lists'
  if (pathname === '/friends') return 'friends'
  if (pathname === '/profile' || pathname === '/settings') return 'you'
  if (pathname.startsWith('/profile/')) {
    return userId && pathname === `/profile/${userId}` ? 'you' : 'friends'
  }
  return null
}

/** The list on screen, if any — Add item offers it first. */
function wishlistIdFor(pathname: string): string | undefined {
  return pathname.match(/^\/wishlist\/([^/]+)/)?.[1]
}

interface NavTabProps {
  label: string
  isActive: boolean
  onClick: () => void
  icon: React.ReactNode
  badge?: number
}

function NavTab({ label, isActive, onClick, icon, badge = 0 }: NavTabProps) {
  return (
    <Flex
      as="button"
      aria-label={badge > 0 ? `${label}, ${badge} new` : label}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      flex="1"
      h="100%"
      direction="column"
      align="center"
      justify="center"
      gap="3px"
      color={isActive ? 'white' : COLORS.text.muted}
      cursor="pointer"
      css={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <Box position="relative" fontSize="20px" lineHeight={1}>
        {icon}
        {badge > 0 && (
          <Box
            position="absolute"
            top="-2px"
            right="-4px"
            w="9px"
            h="9px"
            borderRadius="full"
            bg={COLORS.primary}
            border="2px solid #141414"
          />
        )}
      </Box>
      <Text fontSize="11px" fontWeight={isActive ? 'semibold' : 'medium'} lineHeight={1}>
        {label}
      </Text>
    </Flex>
  )
}

function TabIcon({ isActive, active, inactive }: { isActive: boolean; active: IconType; inactive: IconType }) {
  const Icon = isActive ? active : inactive
  return <Icon />
}

export default function MobileNav() {
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const { user } = useAuth()
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [isCreateWishlistModalOpen, setIsCreateWishlistModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [requestCount, setRequestCount] = useState(0)

  const activeTab = tabFor(pathname, user?.id)
  const isOnFriends = pathname === '/friends'

  // Refreshed on load and whenever Friends is left, since that is where
  // requests get accepted or declined.
  useEffect(() => {
    if (isOnFriends) return
    let cancelled = false
    friendsAPI
      .getFriendRequests()
      .then((requests) => !cancelled && setRequestCount(requests.length))
      .catch(() => {
        // The badge is a hint; without it Friends still works.
      })
    return () => {
      cancelled = true
    }
  }, [isOnFriends])

  const displayName = user?.name || user?.username || ''
  const profileImage = user?.id ? `${API_URL}users/${user.id}/profile-image` : undefined

  return (
    <>
      {/*
        The bar is MOBILE_NAV_HEIGHT of touch targets *plus* the home-indicator
        inset, not that height with the inset eaten out of it — on an iPhone the latter squeezes
        the icons up against the bottom edge.
      */}
      <Box
        as="nav"
        aria-label="Main"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        h={`calc(${MOBILE_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px))`}
        bg="#141414"
        borderTop="1px solid"
        borderColor="whiteAlpha.100"
        zIndex={100}
        display={{ base: 'block', md: 'none' }}
        px={2}
        pb="env(safe-area-inset-bottom, 0px)"
      >
        <Flex h={MOBILE_NAV_HEIGHT} align="stretch">
          <NavTab
            label="Home"
            isActive={activeTab === 'home'}
            onClick={() => router.push('/')}
            icon={<TabIcon isActive={activeTab === 'home'} active={GoHomeFill} inactive={GoHome} />}
          />
          <NavTab
            label="Lists"
            isActive={activeTab === 'lists'}
            onClick={() => router.push('/wishlists/mine')}
            icon={<TabIcon isActive={activeTab === 'lists'} active={PiListBulletsBold} inactive={PiListBullets} />}
          />

          {/* Create is an action, not a place — set apart as a filled button.
              Neutral white rather than a brand or list colour, so it reads the
              same on every screen and never clashes with a list's own colour. */}
          <Flex flex="1" align="center" justify="center">
            <Flex
              as="button"
              aria-label={isCreateMenuOpen ? 'Close create menu' : 'Create'}
              aria-expanded={isCreateMenuOpen}
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              w="42px"
              h="34px"
              borderRadius="lg"
              bg="white"
              color="#141414"
              align="center"
              justify="center"
              fontSize="20px"
              cursor="pointer"
              css={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isCreateMenuOpen ? <LuX /> : <LuPlus />}
            </Flex>
          </Flex>

          <NavTab
            label="Friends"
            isActive={activeTab === 'friends'}
            onClick={() => router.push('/friends')}
            badge={requestCount}
            icon={<TabIcon isActive={activeTab === 'friends'} active={PiUsersFill} inactive={PiUsers} />}
          />
          <NavTab
            label="You"
            isActive={activeTab === 'you'}
            onClick={() => router.push('/profile')}
            icon={
              <Avatar.Root
                size="2xs"
                outline={activeTab === 'you' ? '2px solid white' : 'none'}
                outlineOffset="1px"
              >
                <Avatar.Fallback name={displayName} />
                <Avatar.Image src={profileImage} />
              </Avatar.Root>
            }
          />
        </Flex>
      </Box>

      <MobileCreateMenu
        isOpen={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
        onCreateWishlist={() => {
          setIsCreateMenuOpen(false)
          setIsCreateWishlistModalOpen(true)
        }}
        onAddItem={() => {
          setIsCreateMenuOpen(false)
          setIsAddItemModalOpen(true)
        }}
      />

      <CreateWishlistModal
        isOpen={isCreateWishlistModalOpen}
        onClose={() => setIsCreateWishlistModalOpen(false)}
        onSuccess={() => setIsCreateWishlistModalOpen(false)}
      />

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        preferredWishlistId={wishlistIdFor(pathname)}
      />
    </>
  )
}
