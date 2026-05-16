import { Box, Heading, HStack, Button, SimpleGrid, Image, Text, VStack, useBreakpointValue } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import { API_URL } from '../../services/api'

interface ClaimedItem {
  id: string
  name: string
  price?: number
  image?: string
  owner_name: string
  color?: string
  wishlist_id?: string
}

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
}

export function ClaimedItemsSection({
  items,
  onShowAll,
  onItemClick,
  getItemImageUrl,
  compact = false,
  hideShowAll = false,
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

  // Determine max items based on screen size
  const maxItemsBp = useBreakpointValue({ base: 6, md: 8, xl: 8 }) || 8
  const maxItems = compact ? Math.min(maxItemsBp, 4) : maxItemsBp
  const displayedItems = items.slice(0, maxItems)

  const edge = compact ? { base: 2 as const, md: 3 as const } : { base: 4 as const, md: 8 as const }

  return (
    <Box px={edge} mb={compact ? 1 : 2}>
      <HStack justifyContent="space-between" mb={compact ? 3 : 4}>
        <Heading size={compact ? 'md' : 'lg'} color="white">
          Items Claimed
        </Heading>
        {!hideShowAll && (
          <Button color={COLORS.text.muted} bg={COLORS.background} fontWeight={'bolder'} fontSize="sm" onClick={onShowAll}>
            Show all
          </Button>
        )}
      </HStack>

      <SimpleGrid columns={{ base: 2, md: compact ? 2 : 3, lg: compact ? 2 : 3, xl: compact ? 2 : 4 }} gap={compact ? 2 : 4}>
        {displayedItems.map((item) => (
          <HStack
            key={item.id}
            bg="#1a1a1a"
            borderRadius="lg"
            cursor="pointer"
            onClick={() => onItemClick && onItemClick(item)}
            transition="all 0.2s"
            _hover={{ bg: '#2a2a2a' }}
            gap={0}
            overflow="hidden"
            w={{ base: '100%' }}
            h={compact ? { base: '4.25rem', md: '4.75rem' } : { base: '5rem', md: '6rem' }}
          >
            <Box
              w={compact ? { base: '3.75rem', md: '4.75rem' } : { base: '4rem', md: '6rem' }}
              h={compact ? { base: '4.25rem', md: '4.75rem' } : { base: '5rem', md: '6rem' }}
              flexShrink={0}
              bg={item.color || 'gray.700'}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Image
                src={resolveImageUrl(item)}
                alt={item.name}
                maxW="100%"
                maxH="100%"
                objectFit="contain"
                p={0.5}
              />
            </Box>
            <VStack align="start" gap={0} flex={1} p={compact ? 2 : 3} overflow="hidden">
              <Text
                color="white"
                fontWeight="bold"
                fontSize={
                  compact
                    ? { base: '0.65rem', md: 'xs' }
                    : {
                        base: '0.7rem',
                        md: 'md',
                      }
                }
                lineClamp={2}
              >
                {item.name}
              </Text>
              <Text color={COLORS.text.secondary} fontSize={compact ? { base: '0.58rem', md: 'xs' } : { base: '0.65rem', md: 'sm' }} lineClamp={1}>
                For: {item.owner_name}
              </Text>
              {item.price && (
                <Text
                  color={COLORS.text.primary}
                  fontSize={compact ? { base: '0.58rem', md: 'xs' } : { base: '0.65rem', md: 'sm' }}
                  fontWeight="semibold"
                >
                  ${item.price.toFixed(2)}
                </Text>
              )}
            </VStack>
          </HStack>
        ))}
      </SimpleGrid>
    </Box>
  )
}