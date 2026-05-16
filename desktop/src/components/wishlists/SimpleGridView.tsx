import { Box, SimpleGrid, Image, Text, VStack, HStack } from '@chakra-ui/react'
import { useMemo } from 'react'
import { COLORS } from '../../styles/common'
import { API_URL } from '../../services/api'
import getLightColor from '../common/getLightColor'
import { getPriorityColor } from '../common/getPriorityColor'

export type SortOption = 'none' | 'price-low' | 'price-high' | 'priority-high'

export interface WishlistItem {
  id: string
  name: string
  image?: string
  price?: number
  priority: number
  created_at?: string
  updated_at?: string
}

interface WishlistItemViewProps {
  items: WishlistItem[]
  wishlistColor?: string
  sortBy: SortOption
  onItemClick: (item: WishlistItem) => void
  isSelectionMode?: boolean
  selectedItems?: string[]
  onToggleSelect?: (itemId: string) => void
  /** When provided, overrides API image URLs (e.g. landing demo thumbnails). */
  resolveItemImageUrl?: (item: WishlistItem) => string | undefined | null
  /** Tighter layout for framed previews / marketing demos. */
  compact?: boolean
}

const getPriorityValue = (priority?: string | number): number => {
  if (priority === undefined || priority === null) return 2
  const parsed = parseInt(priority.toString(), 10)
  return !isNaN(parsed) && parsed >= 0 && parsed <= 4 ? parsed : 2
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

export function SimpleGridView({ 
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
    if (resolved != null && resolved !== '') {
      return resolved
    }
    if (item.id && item.image) {
      return `${API_URL}wishlist/${item.id}/image`
    }
    return ''
  }

  const handleItemClick = (item: WishlistItem) => {
      if (isSelectionMode && onToggleSelect) {
        onToggleSelect(item.id)
      } else {
        onItemClick(item)
      }
    }


  const gridColumns = compact
    ? { base: 2, md: 2, lg: 2, xl: 2 }
    : { base: 2, md: 3, lg: 4, xl: 5 }
  const gap = compact ? 2 : 4
  const pad = compact ? { px: 2, py: 2 } : { px: 8, py: 4 }

  return (
    <SimpleGrid columns={gridColumns} gap={gap} {...pad}>
      {sortedItems.map((item) => {
        const imgSrc = resolveImageSrc(item)
        const showImageLayout = Boolean(imgSrc)
        const baseWishlistColor = wishlistColor || COLORS.cardGray
        
        const itemBackgroundColor = sortBy === 'priority-high' 
          ? getPriorityColor(baseWishlistColor, item.priority)
          : baseWishlistColor

        const isSelected = selectedItems.includes(item.id)

        return (
          <Box
            key={item.id}
            borderRadius="lg"
            overflow="hidden"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
            onClick={() => handleItemClick(item)}
            bg={
              isSelected 
                ? backgroundLightColor 
                : wishlistColor 
                  ? itemBackgroundColor 
                  : COLORS.cardGray
            }
          >
            {showImageLayout ? (
              <>
                <Box
                  w="100%"
                  aspectRatio={1}
                  bg={backgroundLightColor}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  overflow="hidden"
                >
                  <Image p={compact ? 2 : 4} src={imgSrc} alt={item.name} maxW="100%" maxH="100%" objectFit="contain" />
                </Box>
                <VStack align="start" p={compact ? 2 : 3} gap={1}>
                  <Text color="white" fontWeight="semibold" fontSize={compact ? 'xs' : 'sm'} lineClamp={2}>
                    {item.name}
                  </Text>
                  <HStack justify="space-between" w="100%">
                    {item.price !== undefined && item.price !== null && (
                      <Text color={COLORS.text.secondary} fontSize={compact ? 'xs' : 'sm'} fontWeight="bold">
                        ${item.price.toFixed(2)}
                      </Text>
                    )}
                    <Text color={COLORS.text.secondary} fontSize={compact ? '0.65rem' : '0.75rem'}>
                      {formatDate(item.created_at)}
                    </Text>
                  </HStack>
                </VStack>
              </>
            ) : (
              <VStack align="start" p={compact ? 3 : 4} gap={2} minH={compact ? '96px' : '150px'} justify="space-between">
                <Text color="white" fontWeight="semibold" fontSize={compact ? 'sm' : 'md'} lineClamp={3}>
                  {item.name}
                </Text>
                <VStack align="start" gap={1} w="100%">
                  {item.price !== undefined && item.price !== null && (
                    <Text color={COLORS.text.secondary} fontSize={compact ? 'xs' : 'sm'} fontWeight="bold">
                      ${item.price.toFixed(2)}
                    </Text>
                  )}
                  <Text color={COLORS.text.secondary} fontSize={compact ? '0.65rem' : '0.75rem'}>
                    {formatDate(item.created_at)}
                  </Text>
                </VStack>
              </VStack>
            )}
          </Box>
        )
      })}
    </SimpleGrid>
  )
}