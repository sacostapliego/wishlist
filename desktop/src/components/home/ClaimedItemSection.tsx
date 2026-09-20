'use client'

import { Box, Heading, HStack, Button, useBreakpointValue } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import { API_URL } from '../../services/api'
import { SnapCarouselRow } from '../common/SnapCarouselRow'
import { ClaimedItemCard, type ClaimedItem } from '../items/ClaimedItemCard'

/**
 * The marketing demo renders these cards inside a fixed-height laptop frame with
 * two carousels stacked under it, so its thumbnail is a letterbox rather than
 * the square used on the real home page — a square one pushes the frame over.
 */
const COMPACT_THUMB_RATIO = 1.35

interface ClaimedItemsSectionProps {
  items: ClaimedItem[]
  onShowAll?: () => void
  onItemClick?: (item: ClaimedItem) => void
  /** When set, used for thumbnail src (e.g. landing demo static URLs); otherwise backend image URLs. */
  getItemImageUrl?: (item: ClaimedItem) => string | undefined | null
  /** Tighter layout for framed previews / marketing demos. */
  compact?: boolean
  /** Omit the "Show all" control (e.g. marketing demo). */
  hideShowAll?: boolean
  /** Hide prev/next arrows (small static demos). */
  hideArrowButtons?: boolean
}

export function ClaimedItemsSection({
  items,
  onShowAll,
  onItemClick,
  getItemImageUrl,
  compact = false,
  hideShowAll = false,
  hideArrowButtons = false,
}: ClaimedItemsSectionProps) {
  const resolveImageUrl = (item: ClaimedItem) => {
    const custom = getItemImageUrl?.(item)
    if (custom != null && custom !== '') {
      return custom
    }
    if (item.image && item.id) {
      return `${API_URL}wishlist/${item.id}/image`
    }
    return ''
  }

  // The row scrolls, but home still only previews — the rest live on /items/claimed
  const maxItemsBp = useBreakpointValue({ base: 6, md: 8, xl: 8 }) || 8
  const maxItems = compact ? Math.min(maxItemsBp, 4) : maxItemsBp
  const displayedItems = items.slice(0, maxItems)

  const headingPx = compact ? { base: 2, md: 3 } : { base: 4, md: 8 }
  const inset = compact ? { base: '0.5rem', md: '0.75rem' } : { base: '1rem', md: '2rem' }

  return (
    <Box mb={compact ? 1 : 2}>
      <HStack justifyContent="space-between" mb={compact ? 3 : 4} px={headingPx}>
        <Heading size={compact ? 'md' : 'lg'} color="white">
          Items Claimed
        </Heading>
        {!hideShowAll && (
          <Button color={COLORS.text.muted} bg={COLORS.background} fontWeight={'bolder'} fontSize="sm" onClick={onShowAll}>
            Show all
          </Button>
        )}
      </HStack>

      <SnapCarouselRow
        inset={inset}
        gap={compact ? { base: 2, md: 2 } : { base: 3, md: 4 }}
        hideArrows={hideArrowButtons}
        arrowSize={compact ? 'sm' : 'md'}
        contentKey={displayedItems.length}
      >
        {displayedItems.map((item) => (
          <ClaimedItemCard
            key={item.id}
            item={item}
            imageUrl={resolveImageUrl(item)}
            onOpen={(clicked) => onItemClick?.(clicked)}
            compact={compact}
            thumbRatio={compact ? COMPACT_THUMB_RATIO : 1}
            width={compact ? { base: '9rem', md: '10.5rem' } : { base: '11.5rem', md: '13rem', lg: '14rem' }}
          />
        ))}
      </SnapCarouselRow>
    </Box>
  )
}
