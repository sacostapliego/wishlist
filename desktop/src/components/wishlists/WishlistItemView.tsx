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
}

interface WishlistItemViewProps {
  items: WishlistItem[]
  wishlistColor?: string
  sortBy: SortOption
  onItemClick: (item: WishlistItem) => void
  isSelectionMode?: boolean
  selectedItems?: string[]
  onToggleSelect?: (itemId: string) => void
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

export function WishlistItemView({ 
  items, 
  wishlistColor, 
  sortBy, 
  onItemClick,
  isSelectionMode = false,
  selectedItems = [],
  onToggleSelect
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

  const handleItemClick = (item: WishlistItem) => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(item.id)
    } else {
      onItemClick(item)
    }
  }

  return (
    <VStack align="stretch" gap={{ base: '1rem', md: '1rem' }} px={{ base: '1rem', md: '2rem' }} py={{ base: '0', md: '1rem' }}>
      {sortedItems.map((item) => {
        const hasImage = item.id && item.image
        const baseWishlistColor = wishlistColor || COLORS.cardGray
        
        const itemBackgroundColor = sortBy === 'priority-high' 
          ? getPriorityColor(baseWishlistColor, item.priority)
          : baseWishlistColor

        const displayDate = item.updated_at || item.created_at

        const isSelected = selectedItems.includes(item.id)

        return (
          <HStack
            key={item.id}
            p="1rem"
            gap={{ base: "1rem", md:"2rem"}}
            cursor="pointer"
            transition="all 0.2s"
            borderRadius="0.375rem"
            _hover={{ bg: backgroundLightColor }}
            onClick={() => handleItemClick(item)}
            bg={
              isSelected 
                ? backgroundLightColor 
                : wishlistColor 
                  ? itemBackgroundColor 
                  : COLORS.cardGray
            }
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
                w={{ base: '5rem', md: '9rem' }}
                h={{ base: '5rem', md: '9rem' }}
                borderRadius="0.375rem"
                bg={backgroundLightColor}
                flexShrink={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
              >
                <Image
                  p={{base: 1, md: 2}}
                  src={`${API_URL}wishlist/${item.id}/image`}
                  alt={item.name}
                  maxW="100%"
                  maxH="100%"
                  objectFit="contain"
                />
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
                <Text 
                  color="white" 
                  fontWeight="medium" 
                  fontSize="1rem"
                  lineClamp={2}
                >
                  {item.name}
                </Text>
              </Box>)}

              {!hasImage && (
                <Box 
                  h={{ base: '5rem', md: '9rem' }}
                  flex={1} 
                  minW={0}
                  display={'flex'}
                  alignItems="center"
                >
                  <Text 
                    color="white"
                    fontWeight="medium" 
                    fontSize="1rem"
                    lineClamp={2}
                  >
                    {item.name}
                  </Text>
              </Box>)}

              {/* Price */}
              <Box w={{ base: '4rem', md: '6.25rem' }} textAlign={{base:"left", md:"right"}}>
                {item.price !== undefined && item.price !== null ? (
                  <Text color={COLORS.text.secondary} fontSize="0.875rem" fontWeight="semibold">
                    ${item.price.toFixed(2)}
                  </Text>
                ) : (
                  <Text></Text>
                )}
              </Box>
            </Stack>

            {/* Date - Hidden on mobile */}
            <Box w="7.5rem" textAlign="right" display={{ base: 'none', md: 'block' }}>
              <Text color={COLORS.text.secondary} fontSize="0.75rem">
                {formatDate(displayDate)}
              </Text>
            </Box>
          </HStack>
        )
      })}
    </VStack>
  )
}