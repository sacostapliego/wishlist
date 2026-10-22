import { Box, Image, Text, HStack, VStack, Stack } from '@chakra-ui/react'
import { useMemo } from 'react'
import { COLORS } from '../../styles/common'
import { API_URL } from '../../services/api'
import getLightColor from '../common/getLightColor'
import { getPriorityColor } from '../common/getPriorityColor'
import { LuCheck } from 'react-icons/lu'

export type SortOption = 'none' | 'price-low' | 'price-high' | 'priority-high'

export interface WishlistItem {
  id: string
  name: string
  image?: string
  price?: number
  priority: number
  created_at?: string
  updated_at?: string
  is_claimed?: boolean | null
  claimed_by_viewer?: boolean
  is_contribution?: boolean
  contribution_total?: number | null
  contributions_hidden?: boolean
}

interface WishlistItemViewProps {
  items: WishlistItem[]
  wishlistColor?: string
  sortBy: SortOption
  onItemClick: (item: WishlistItem) => void
  isSelectionMode?: boolean
  selectedItems?: string[]
  onToggleSelect?: (itemId: string) => void
  resolveItemImageUrl?: (item: WishlistItem) => string | undefined | null
  compact?: boolean
}

const getPriorityValue = (priority?: string | number): number => {
  if (priority === undefined || priority === null) return 2
  const parsed = parseInt(priority.toString(), 10)
  return !isNaN(parsed) && parsed >= 0 && parsed <= 4 ? parsed : 2
}

/**
 * Short claim / funding status for a row. The server already withholds claims
 * and pledges from the owner of a blind list, so this shows only what the
 * viewer may know — and nothing at all for an item nobody has acted on.
 */
const getItemStatus = (item: WishlistItem): { label: string; done: boolean } | null => {
  if (item.is_contribution) {
    const total = item.contribution_total ?? 0
    if (item.contributions_hidden || total <= 0) return null
    if (item.price) {
      if (total >= item.price) return { label: 'Funded', done: true }
      return { label: `$${Math.round(total)} of $${Math.round(item.price)}`, done: false }
    }
    return { label: `$${Math.round(total)} raised`, done: false }
  }
  if (item.is_claimed) return { label: item.claimed_by_viewer ? 'Claimed by you' : 'Claimed', done: true }
  return null
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return date.toLocaleDateString()
}

export function WishlistItemView({
  items,
  wishlistColor,
  sortBy,
  onItemClick,
  isSelectionMode = false,
  selectedItems = [],
  onToggleSelect,
  resolveItemImageUrl,
  compact = false,
}: WishlistItemViewProps) {
  const sortedItems = useMemo(() => {
    const itemsCopy = [...items]
    
    switch (sortBy) {
      case 'price-high':
        return itemsCopy.sort((a, b) => (b.price || 0) - (a.price || 0))
      case 'price-low':
        return itemsCopy.sort((a, b) => (a.price || 0) - (b.price || 0))
      case 'priority-high':
        return itemsCopy.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority))
      default:
        return itemsCopy
    }
  }, [items, sortBy])

  const backgroundLightColor = getLightColor(wishlistColor || COLORS.cardGray)

  const resolveImageSrc = (item: WishlistItem) => {
    const resolved = resolveItemImageUrl?.(item)
    if (resolved != null && resolved !== '') return resolved
    if (item.id && item.image) return `${API_URL}wishlist/${item.id}/image`
    return ''
  }

  /*
    Phone: divided rows (Apple Music track list) instead of separated cards.
    With the list colour on, rows carry a soft tint of it and the image tile the
    full colour - solid rows would undo the header's fade into the page.
  */
  const plainRows = !compact
  const rowPlain = <T,>(phone: T, otherwise: T) => (plainRows ? { base: phone, md: otherwise } : otherwise)

  const imgBox = compact ? { base: '3.25rem', md: '3.75rem' } : { base: '5rem', md: '9rem' }

  const handleItemClick = (item: WishlistItem) => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(item.id)
    } else {
      onItemClick(item)
    }
  }

  return (
    <VStack align="stretch" gap={compact ? '0.5rem' : { base: plainRows ? 0 : '1rem', md: '1rem' }} px={compact ? { base: '0.75rem', md: '1rem' } : { base: '1rem', md: '2rem' }} py={compact ? 2 : { base: '0', md: '1rem' }}>
      {sortedItems.map((item, index) => {
        const imgSrc = resolveImageSrc(item)
        const hasImage = Boolean(imgSrc)
        const baseWishlistColor = wishlistColor || COLORS.cardGray
        
        const itemBackgroundColor = sortBy === 'priority-high' 
          ? getPriorityColor(baseWishlistColor, item.priority)
          : baseWishlistColor

        const displayDate = item.updated_at || item.created_at

        const isSelected = selectedItems.includes(item.id)
        const tint = (share: number) => `color-mix(in oklab, ${itemBackgroundColor} ${share}%, #141414)`
        const cardBg = wishlistColor ? itemBackgroundColor : COLORS.cardGray
        const rowBg = isSelected
          ? rowPlain(wishlistColor ? tint(40) : backgroundLightColor, backgroundLightColor)
          : rowPlain(wishlistColor ? tint(18) : 'transparent', cardBg)
        const status = getItemStatus(item)

        return (
          <HStack
            key={item.id}
            p={compact ? '0.5rem 0.65rem' : rowPlain(wishlistColor ? '0.75rem' : '0.75rem 0', '1rem')}
            gap={compact ? '0.75rem' : { base: '1rem', md: '2rem' }}
            cursor="pointer"
            transition="all 0.2s"
            borderRadius={rowPlain('0', '0.375rem')}
            /* Every plain row closes with a divider; the first also opens with one so the list is ruled top and bottom */
            borderTop={index === 0 ? rowPlain('1px solid rgba(255, 255, 255, 0.08)', 'none') : undefined}
            borderBottom={rowPlain('1px solid rgba(255, 255, 255, 0.08)', 'none')}
            _hover={{ bg: rowPlain(wishlistColor ? tint(28) : backgroundLightColor, backgroundLightColor) }}
            onClick={() => handleItemClick(item)}
            bg={rowBg}
            position="relative"
          >
            {/* Selection Checkbox */}
            {isSelectionMode && (
              <Box
                w={6}
                h={6}
                borderRadius="md"
                border="2px solid"
                borderColor={isSelected ? itemBackgroundColor : 'white'}
                bg={isSelected ? itemBackgroundColor : 'transparent'}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                {isSelected && (
                  <LuCheck size={16} color="white" />
                )}
              </Box>
            )}

            {/* Image - Only render if hasImage */}
            {hasImage && (
              <Box
                w={imgBox}
                h={imgBox}
                borderRadius="0.375rem"
                bg={wishlistColor ? rowPlain(itemBackgroundColor, backgroundLightColor) : backgroundLightColor}
                flexShrink={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
              >
                <Image p={compact ? 1 : { base: 1, md: 2 }} src={imgSrc} alt={item.name} maxW="100%" maxH="100%" objectFit="contain" />
              </Box>
            )}

            <Stack
              flex={1}
              direction={{base: "column", md: "row"}}
              alignItems={{base:"none", md:"center"}}
              justifyContent={{base:"none", md:"center"}}
            >
              {/* Item Name */}
              {hasImage && (<Box flex={1} minW={0}>
                <Text color="white" fontWeight="medium" fontSize={compact ? 'sm' : '1rem'} lineClamp={compact ? 2 : { base: 1, md: 2 }}>
                  {item.name}
                </Text>
              </Box>)}

              {!hasImage && (
                <Box h={imgBox} flex={1} minW={0} display="flex" alignItems="center">
                  <Text color="white" fontWeight="medium" fontSize={compact ? 'sm' : '1rem'} lineClamp={compact ? 2 : { base: 1, md: 2 }}>
                    {item.name}
                  </Text>
                </Box>
              )}

              {/* Price, with claim / funding status beside it on phones and under it on desktop */}
              <Stack
                direction={{ base: 'row', md: 'column' }}
                align={{ base: 'center', md: 'flex-end' }}
                gap={{ base: 2, md: 0.5 }}
                w={{ base: 'auto', md: '6.25rem' }}
                textAlign={{base:"left", md:"right"}}
              >
                {item.price !== undefined && item.price !== null && (
                  <Text color={COLORS.text.secondary} fontSize={compact ? 'xs' : '0.875rem'} fontWeight="semibold">
                    ${item.price.toFixed(2)}
                  </Text>
                )}
                {status && (
                  <HStack gap={1} color={status.done ? '#8FD6A8' : COLORS.text.subtle} fontSize={compact ? '10px' : 'xs'} fontWeight="semibold" whiteSpace="nowrap">
                    {status.done && <LuCheck />}
                    <Text>{status.label}</Text>
                  </HStack>
                )}
              </Stack>
            </Stack>

            {/* Date - Hidden on mobile */}
            <Box w={compact ? '5rem' : '7.5rem'} textAlign="right" display={{ base: compact ? 'none' : 'none', md: 'block' }}>
              <Text color={COLORS.text.secondary} fontSize={compact ? '10px' : '0.75rem'}>
                {formatDate(displayDate)}
              </Text>
            </Box>
          </HStack>
        )
      })}
    </VStack>
  )
}