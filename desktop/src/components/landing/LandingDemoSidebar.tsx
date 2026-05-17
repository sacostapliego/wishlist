'use client'

import { Box, IconButton, Image, Separator, VStack } from '@chakra-ui/react'
import { LuHouse, LuPlus, LuUserRound, LuUsers } from 'react-icons/lu'
import { useRouter } from 'next/navigation'
import { WishlistItem } from '@/components/layout/sidebar/WishlistItem'
import type { LandingDemoWishlist } from '@/data/landingDemoData'
import { resolveWishlistThumbnail } from '@/utils/wishlistIcons'
import { COLORS } from '@/styles/common'

const FRIEND_TILE = 38

interface LandingDemoSidebarProps {
  mine: LandingDemoWishlist[]
  friends: LandingDemoWishlist[]
  onSelectWishlist: (id: string) => void
  onDemoHome: () => void
  /** When set (wishlist / item demo screen), thumbnails show which list is open. */
  activeWishlistId?: string | null
}

/**
 * Marketing demo sidebar: three vertical stages like the real app —
 * (1) profile + Home / Create / Friends, (2) your wishlists only, (3) friend thumbnails.
 */
export function LandingDemoSidebar({
  mine,
  friends,
  onSelectWishlist,
  onDemoHome,
  activeWishlistId,
}: LandingDemoSidebarProps) {
  const router = useRouter()

  return (
    <Box
      bg="#141414"
      h="100%"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      alignItems="stretch"
      justifyContent="flex-start"
      px={2}
      py={3}
    >
      {/* Stage 1 — profile + primary nav (Create / Friends are visual only) */}
      <VStack flexShrink={0} align="stretch" gap={1}>
        <IconButton aria-label="Guest profile" type="button" variant="ghost" size="sm" onClick={() => router.push('/auth/login')}>
          <LuUserRound />
        </IconButton>
        <Separator flexShrink={0} my={1.5} />
        <IconButton aria-label="Home" type="button" variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); onDemoHome(); }}>
          <LuHouse />
        </IconButton>
        <IconButton
          aria-label="Create (preview only)"
          type="button"
          variant="ghost"
          size="sm"
          opacity={0.42}
          pointerEvents="none"
          tabIndex={-1}
          disabled
          cursor="not-allowed"
        >
          <LuPlus />
        </IconButton>
        <IconButton
          aria-label="Friends (preview only)"
          type="button"
          variant="ghost"
          size="sm"
          opacity={0.42}
          pointerEvents="none"
          tabIndex={-1}
          disabled
          cursor="not-allowed"
        >
          <LuUsers />
        </IconButton>
      </VStack>

      <Separator flexShrink={0} my={1} />

      {/* Stage 2 — your wishlists only (scroll when many) */}
      <VStack align="stretch" gap={2.5} pb={2.5} pt={2.5} flexShrink={0} minH={0} overflowY="auto" overflowX="hidden">
        {mine.map((w) => (
          <WishlistItem
            key={w.id}
            id={w.id}
            title={w.name}
            color={w.color}
            thumbnail_type="icon"
            thumbnail_icon={w.thumbnail_icon ?? null}
            thumbnail_image={null}
            demo_thumbnail_url={w.demo_thumbnail_url}
            isCollapsed
            onClick={() => onSelectWishlist(w.id)}
          />
        ))}
      </VStack>

      <Separator flexShrink={0} my={1} />

      {/* Stage 3 — friend lists as rounded thumbnails (tap opens sample list) */}
      <VStack flexShrink={0} align="center" gap={2.5} pb={2.5} pt={2.5}>
        {friends.map((w) => {
          const thumb = resolveWishlistThumbnail({
            id: w.id,
            thumbnail_type: 'icon',
            thumbnail_icon: w.thumbnail_icon ?? null,
            thumbnail_image: null,
            demo_thumbnail_url: w.demo_thumbnail_url,
          })
          return (
            <IconButton
              key={`fr-${w.id}`}
              type="button"
              aria-label={w.owner_label ?? w.name}
              variant="ghost"
              size="sm"
              p={0}
              minW={`${FRIEND_TILE}px`}
              minH={`${FRIEND_TILE}px`}
              h={`${FRIEND_TILE}px`}
              w={`${FRIEND_TILE}px`}
              borderRadius="md"
              overflow="hidden"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSelectWishlist(w.id)
              }}
              flexShrink={0}
            >
              {thumb.type === 'image' ? (
                <Image pointerEvents="none" src={thumb.url} alt="" w="100%" h="100%" objectFit="cover" draggable={false} />
              ) : (
                <Box
                  pointerEvents="none"
                  w="100%"
                  h="100%"
                  bg={w.color || COLORS.cardGray}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box as={thumb.icon} boxSize="22px" color="white" />
                </Box>
              )}
            </IconButton>
          )
        })}
      </VStack>
    </Box>
  )
}
