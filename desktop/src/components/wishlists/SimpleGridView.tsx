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

  const backgroundLightColor = getLightColor(wishlistColor || COLORS.cardGray);

  const handleItemClick = (item: WishlistItem) => {
      if (isSelectionMode && onToggleSelect) {
        onToggleSelect(item.id)
      } else {
        onItemClick(item)
      }
    }


  return (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} gap={4} px={8} py={4}>
      {sortedItems.map((item) => {
        const hasImage = item.id && item.image
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
            {hasImage ? (
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
                  <Image
                    p={4}
                    src={`${API_URL}wishlist/${item.id}/image`}
                    alt={item.name}
                    maxW="100%"
                    maxH="100%"
                    objectFit="contain"
                  />
                </Box>
                <VStack align="start" p={3} gap={1}>
                  <Text color="white" fontWeight="semibold" fontSize="sm" lineClamp={2}>
                    {item.name}
                  </Text>
                  <HStack justify="space-between" w="100%">
                    {item.price !== undefined && item.price !== null && (
                      <Text color={COLORS.text.secondary} fontSize="sm" fontWeight="bold">
                        ${item.price.toFixed(2)}
                      </Text>
                    )}
                    <Text color={COLORS.text.secondary} fontSize="0.75rem">
                      {formatDate(item.created_at)}
                    </Text>
                  </HStack>
                </VStack>
              </>
            ) : (
              <VStack align="start" p={4} gap={2} minH="150px" justify="space-between">
                <Text color="white" fontWeight="semibold" fontSize="md" lineClamp={3}>
                  {item.name}
                </Text>
                <VStack align="start" gap={1} w="100%">
                  {item.price !== undefined && item.price !== null && (
                    <Text color={COLORS.text.secondary} fontSize="sm" fontWeight="bold">
                      ${item.price.toFixed(2)}
                    </Text>
                  )}
                  <Text color={COLORS.text.secondary} fontSize="0.75rem">
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