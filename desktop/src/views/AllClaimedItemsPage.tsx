'use client'

import { Box, HStack, VStack, Heading, Text, IconButton, SimpleGrid } from '@chakra-ui/react'
import { LuArrowLeft } from 'react-icons/lu'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { wishlistAPI, type ClaimedItemResponse } from '../services/wishlist'
import { isWishlistActive } from '../utils/wishlistUtils'
import { COLORS } from '../styles/common'
import { API_URL } from '../services/api'
import { ClaimedItemCard, type ClaimedItem } from '../components/items/ClaimedItemCard'

interface ClaimedItemGridProps {
  items: ClaimedItem[]
  onNavigate: (wishlistId: string, itemId: string) => void
  getImageUrl: (item: ClaimedItem) => string
}

function ClaimedItemGrid({ items, onNavigate, getImageUrl }: ClaimedItemGridProps) {
  if (items.length === 0) return null

  return (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} gap={{ base: 3, md: 4 }}>
      {items.map((item) => (
        <ClaimedItemCard
          key={item.id}
          item={item}
          imageUrl={getImageUrl(item)}
          onOpen={(clicked) => onNavigate(clicked.wishlist_id!, clicked.id)}
        />
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
        description: item.description,
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
    <Box
      /*
        Desktop only: a fixed-height pane that scrolls inside the layout.
        On a phone this has to be auto — ResponsiveLayout is already a scroll
        container, and a second one nested inside it traps the scroll and hides
        content behind the bottom nav. Letting the page grow lets the layout's
        own bottom margin clear the nav.
      */
      h={{ base: "auto", md: "calc(100vh - 32px)" }}
      w="100%"
      overflowY={{ base: "visible", md: "auto" }}
      /* Pairing overflow-x:hidden with overflow-y:visible makes the browser
         compute overflow-y as auto, re-nesting the scroll container. The
         layout above already clips horizontally on mobile. */
      overflowX={{ base: "visible", md: "hidden" }}
    >
      {/* Header */}
      <Box bg={COLORS.background} px={{ base: 4, md: 8 }} py={4} position="sticky" top={0} zIndex={10}>
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
          <VStack align="stretch" gap={{ base: 4, md: 8 }}>
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