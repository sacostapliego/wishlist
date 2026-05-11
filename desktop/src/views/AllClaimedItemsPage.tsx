'use client'

import { Box, HStack, VStack, Heading, Text, IconButton, SimpleGrid, Image } from '@chakra-ui/react'
import { LuArrowLeft, LuGift } from 'react-icons/lu'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { wishlistAPI, type ClaimedItemResponse } from '../services/wishlist'
import { isWishlistActive } from '../utils/wishlistUtils'
import { COLORS } from '../styles/common'
import { API_URL } from '../services/api'

interface ClaimedItem {
  id: string
  name: string
  price?: number
  image?: string
  owner_name: string
  color?: string
  wishlist_id?: string
  wishlist_due_date?: string | null
}

interface ClaimedItemGridProps {
  items: ClaimedItem[]
  onNavigate: (wishlistId: string, itemId: string) => void
  getImageUrl: (item: ClaimedItem) => string
}

function ClaimedItemGrid({ items, onNavigate, getImageUrl }: ClaimedItemGridProps) {
  if (items.length === 0) return null

  return (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} gap={{ base: 0, md: 6 }}>
      {items.map((item) => (
        <Box
          key={item.id}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{ bg: '#2a2a2a' }}
          onClick={() => onNavigate(item.wishlist_id!, item.id)}
          borderRadius="lg"
          p={4}
        >
          <VStack gap={3} align="stretch">
            <Box
              w="100%"
              aspectRatio={1}
              overflow="hidden"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={item.color || COLORS.cardGray}
            >
              {item.image ? (
                <Image
                  src={getImageUrl(item)}
                  alt={item.name}
                  objectFit="contain"
                  w="100%"
                  h="100%"
                  p={1}
                />
              ) : (
                <LuGift color="white" fontSize="4xl" />
              )}
            </Box>
            <VStack gap={0} align="start">
              <Text color="white" fontWeight="semibold" fontSize={{ base: "0.8rem", md: "md" }} lineClamp={{ base: 1, md: 2 }}>
                {item.name}
              </Text>
              {item.price && (
                <Text color={COLORS.text.secondary} fontSize={{ base: "0.7rem", md: "sm" }}>
                  ${item.price.toFixed(2)}
                </Text>
              )}
              <Text color={COLORS.text.secondary} fontSize={{ base: "0.7rem", md: "sm" }} lineClamp={{ base: 1, md: 2 }}>
                For: {item.owner_name}
              </Text>
            </VStack>
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  )
}

function AllClaimedItemsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<ClaimedItem[]>([])
  const [loading, setLoading] = useState(true)
  const fromMobileNav = searchParams?.get('fromMobileNav') === 'true'

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await wishlistAPI.getClaimedItems()
      const transformed = data.map((item: ClaimedItemResponse) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        owner_name: item.owner_name,
        color: item.wishlist_color,
        wishlist_id: item.wishlist_id,
        wishlist_due_date: item.wishlist_due_date,
      }))
      setItems(transformed)
    } catch (error) {
      console.error('Error loading claimed items:', error)
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (item: ClaimedItem) => {
    if (item.image && item.id) {
      return `${API_URL}wishlist/${item.id}/image`
    }
    return ''
  }

  const activeItems = items.filter(item => isWishlistActive(item.wishlist_due_date))
  const inactiveItems = items.filter(item => !isWishlistActive(item.wishlist_due_date))

  const handleNavigate = (wishlistId: string, itemId: string) => {
    router.push(`/wishlist/${wishlistId}/${itemId}`)
  }

  if (loading) {
    return (
      <Box h="calc(100vh - 32px)" w="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">Loading...</Text>
      </Box>
    )
  }

  return (
    <Box h={{ base: "calc(100vh + 80px)", md: "calc(100vh - 32px)" }} w="100%" overflowY="auto" overflowX="hidden">
      {/* Header */}
      <Box bg={COLORS.background} px={8} py={4} position="sticky" top={0} zIndex={10}>
        <HStack gap={4}>
          {!fromMobileNav && (
            <IconButton
              aria-label="Go back"
              variant="ghost"
              onClick={() => router.back()}
              color="white"
              size="lg"
            >
              <LuArrowLeft />
            </IconButton>
          )}
          <Heading size="xl" color="white">Items Claimed</Heading>
        </HStack>
      </Box>

      <Box px={{ base: 4, md: 8 }} py={{ base: 4, md: 6 }}>
        {items.length === 0 ? (
          <Text color="gray.400">No claimed items found</Text>
        ) : (
          <VStack align="stretch" gap={8}>
            {/* Active Section */}
            <Box>
              <Heading size="md" color="white" mb={4}>Active</Heading>
              {activeItems.length === 0 ? (
                <Text color={COLORS.text.secondary} fontSize="sm">No active claimed items</Text>
              ) : (
                <ClaimedItemGrid items={activeItems} onNavigate={handleNavigate} getImageUrl={getImageUrl} />
              )}
            </Box>

            {/* Inactive Section */}
            <Box>
              <Heading size="md" color="white" mb={4}>Inactive</Heading>
              {inactiveItems.length === 0 ? (
                <Text color={COLORS.text.secondary} fontSize="sm">No inactive claimed items</Text>
              ) : (
                <ClaimedItemGrid items={inactiveItems} onNavigate={handleNavigate} getImageUrl={getImageUrl} />
              )}
            </Box>
          </VStack>
        )}
      </Box>
    </Box>
  )
}

export default AllClaimedItemsPage