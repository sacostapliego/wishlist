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
}

export function ClaimedItemsSection({ items, onShowAll, onItemClick }: ClaimedItemsSectionProps) {
  const getImageUrl = (item: ClaimedItem) => {
    if (item.image && item.id) {
      return `${API_URL}wishlist/${item.id}/image`;
    }
    return '';
  };

  // Determine max items based on screen size
  const maxItems = useBreakpointValue({ base: 6, md: 8, xl: 8 }) || 8;
  const displayedItems = items.slice(0, maxItems);

  return (
    <Box px={{ base: 4, md: 8 }} mb={2}>
      <HStack justifyContent="space-between" mb={4}>
        <Heading size="lg" color="white">Items Claimed</Heading>
        <Button color={COLORS.text.muted} bg={COLORS.background} fontWeight={"bolder"} fontSize="sm" onClick={onShowAll}>
          Show all
        </Button>
      </HStack>
      
      <SimpleGrid columns={{ base: 2, md: 3, lg: 3, xl: 4 }} gap={4}>
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
            w={{ base: "100%" }}
            h={{ base: "5rem", md: "6rem" }}
          >
            <Box
              w={{ base: "4rem", md: "6rem" }}
              h={{ base: "5rem", md: "6rem" }}
              flexShrink={0}
              bg={item.color || 'gray.700'}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Image
                src={getImageUrl(item)}
                alt={item.name}
                maxW="100%"
                maxH="100%"
                objectFit="contain"
                p={0.5}
              />
            </Box>
            <VStack align="start" gap={0} flex={1} p={3} overflow="hidden">
              <Text color="white" fontWeight="bold" fontSize={{base: '0.7rem', md: 'md'}} lineClamp={2}>
                {item.name}
              </Text>
              <Text color={COLORS.text.secondary} fontSize={{base: '0.65rem', md: 'sm'}} lineClamp={1}>
                For: {item.owner_name}
              </Text>
              {item.price && (
                <Text color={COLORS.text.primary} fontSize={{base: '0.65rem', md: 'sm'}} fontWeight="semibold">
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