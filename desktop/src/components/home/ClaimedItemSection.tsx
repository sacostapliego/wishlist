'use client'

import { Box, Heading, HStack, Button, Text, VStack } from '@chakra-ui/react'
import { FaChevronRight } from 'react-icons/fa'
import { COLORS } from '../../styles/common'
import { API_URL } from '../../services/api'
import { SnapCarouselRow } from '../common/SnapCarouselRow'
import { ClaimedItemCard, type ClaimedItem, type ClaimedItemCardProps } from '../items/ClaimedItemCard'

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

/**
 * Closes the row with the count home is holding back, sized exactly like a
 * card so the row still reads as one rhythm.
 */
function ShowAllTile({
  count,
  compact,
  thumbRatio,
  width,
  onClick,
}: {
  count: number
  compact: boolean
  thumbRatio: number
  width: ClaimedItemCardProps['width']
  onClick: () => void
}) {
  return (
    <VStack
      as="button"
      w={width}
      flexShrink={0}
      align="stretch"
      gap={compact ? 1 : 2}
      p={compact ? 2 : 0}
      cursor="pointer"
      onClick={onClick}
      aria-label={`Show all claimed items, ${count} more`}
    >
      <Box
        w="100%"
        aspectRatio={thumbRatio}
        borderRadius="md"
        bg="rgba(255,255,255,0.05)"
        border="1px dashed"
        borderColor="rgba(255,255,255,0.18)"
        transition="background 0.2s"
        _hover={{ bg: 'rgba(255,255,255,0.1)' }}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
      >
        <Box as={FaChevronRight} boxSize={compact ? '1rem' : '1.5rem'} color={COLORS.text.muted} />
        <Text fontSize={compact ? 'xs' : 'sm'} fontWeight="bold" color="white">
          +{count} more
        </Text>
      </Box>
      <Text fontSize="xs" color={COLORS.text.subtle} textAlign="center" lineClamp={1}>
        Show all
      </Text>
    </VStack>
  )
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

  /**
   * Home previews, it doesn't list — the rest live on /items/claimed. The cap
   * is a flat 5 so the row ends on a deliberate "+N more" tile rather than
   * trailing off mid-scroll at whatever width the viewport happens to be.
   */
  const maxItems = compact ? 4 : 5
  const displayedItems = items.slice(0, maxItems)
  const overflowCount = items.length - displayedItems.length

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

        {overflowCount > 0 && (
          <ShowAllTile
            count={overflowCount}
            compact={compact}
            thumbRatio={compact ? COMPACT_THUMB_RATIO : 1}
            width={compact ? { base: '9rem', md: '10.5rem' } : { base: '11.5rem', md: '13rem', lg: '14rem' }}
            onClick={() => onShowAll?.()}
          />
        )}
      </SnapCarouselRow>
    </Box>
  )
}
