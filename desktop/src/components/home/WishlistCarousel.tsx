'use client'

import { Box, Heading, HStack, Button, Text, Image } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import { resolveWishlistThumbnail } from '../../utils/wishlistIcons'
import { DueBadge } from '../common/DueBadge'
import { SnapCarouselRow } from '../common/SnapCarouselRow'
import { formatItemCount } from '../../utils/wishlistUtils'

interface Wishlist {
  id: string
  name: string
  image?: string
  color?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
  demo_thumbnail_url?: string | null
  /** Owner's name — required to tell three lists called "Birthday" apart. */
  ownerName?: string
  itemCount?: number
  due_date?: string | null
}

interface WishlistCarouselProps {
  title: string
  wishlists: Wishlist[]
  onShowAll?: () => void
  onWishlistClick?: (wishlistId: string) => void
  /** Tighter layout for framed previews / marketing demos. */
  compact?: boolean
  /** Omit the "Show all" control (e.g. marketing demo). */
  hideShowAll?: boolean
  /** Hide prev/next arrows (small static demos). */
  hideArrowButtons?: boolean
}

export function WishlistCarousel({
  title,
  wishlists,
  onShowAll,
  onWishlistClick,
  compact = false,
  hideShowAll = false,
  hideArrowButtons = false,
}: WishlistCarouselProps) {
  const headingPx = compact ? { base: 2, md: 3 } : { base: 4, md: 8 }
  const inset = compact ? { base: '0.5rem', md: '0.75rem' } : { base: '0.75rem', md: '2rem' }

  return (
    <Box mb={{ base: 1, md: 1 }}>
      <HStack justifyContent="space-between" px={headingPx}>
        <Heading size={compact ? 'md' : 'lg'} color="white">
          {title}
        </Heading>
        {!hideShowAll && (
          <Button color={COLORS.text.muted} bg={COLORS.background} fontWeight={'bolder'} fontSize="sm" onClick={onShowAll}>
            Show all
          </Button>
        )}
      </HStack>

      <SnapCarouselRow
        inset={inset}
        gap={compact ? { base: 1, md: 2 } : { base: 1, md: 4 }}
        hideArrows={hideArrowButtons}
        arrowSize={compact ? 'sm' : 'md'}
        contentKey={wishlists.length}
      >
        {wishlists.map((wishlist) => {
          const thumbnail = resolveWishlistThumbnail(wishlist)
          const cardW = compact
            ? { base: '7.5rem', md: '9rem', lg: '10rem' }
            : { base: '10rem', md: '12rem', lg: '13rem' }
          const iconSz = compact ? '2.85rem' : '5rem'
          const nameFs = compact
            ? { base: '0.72rem', md: 'xs', lg: 'sm' }
            : { base: 'xs', md: 'sm', lg: 'md' }

          return (
            <Box
              key={wishlist.id}
              w={cardW}
              flexShrink={0}
              borderRadius="md"
              p={compact ? 2 : 4}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ bg: '#2a2a2a' }}
              onClick={(e) => {
                e.preventDefault()
                onWishlistClick?.(wishlist.id)
              }}
              display="flex"
              flexDirection="column"
              gap={compact ? 1 : 2}
            >
              <Box
                pointerEvents="none"
                w="100%"
                aspectRatio={1}
                overflow="hidden"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={thumbnail.type === 'image' ? 'transparent' : wishlist.color || COLORS.cardGray}
              >
                {thumbnail.type === 'image' ? (
                  <Image src={thumbnail.url} alt={wishlist.name} w="100%" h="100%" objectFit="cover" draggable={false} />
                ) : (
                  <Box as={thumbnail.icon} boxSize={iconSz} color="white" />
                )}
              </Box>
              <Box pointerEvents="none">
                <Text color="white" fontWeight="semibold" fontSize={nameFs} lineClamp={1}>
                  {wishlist.name}
                </Text>
                <HStack gap={2} mt={0.5} minH="18px">
                  {(wishlist.ownerName || wishlist.itemCount !== undefined) && (
                    <Text fontSize="xs" color={COLORS.text.subtle} lineClamp={1}>
                      {[wishlist.ownerName, wishlist.itemCount !== undefined ? formatItemCount(wishlist.itemCount) : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  )}
                  <DueBadge due_date={wishlist.due_date} />
                </HStack>
              </Box>
            </Box>
          )
        })}
      </SnapCarouselRow>
    </Box>
  )
}
