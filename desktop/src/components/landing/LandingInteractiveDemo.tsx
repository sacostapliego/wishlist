'use client'

import { useCallback, useMemo, useState } from 'react'
import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { ClaimedItemsSection } from '@/components/home/ClaimedItemSection'
import { WishlistCarousel } from '@/components/home/WishlistCarousel'
import { WishlistFilters } from '@/components/wishlists/WishlistFilters'
import { WishlistItemView, type SortOption, type WishlistItem as DemoListItem } from '@/components/wishlists/WishlistItemView'
import { OwnerWishlistView } from '@/components/wishlists/OwnerWishlistView'
import { SharedWishlistView } from '@/components/wishlists/SharedWishlistView'
import { ItemDetailContent } from '@/components/items/ItemDetailContent'
import type { MenuOption } from '@/components/items/ItemMenu'
import { LandingDemoSidebar } from '@/components/landing/LandingDemoSidebar'
import { BsFillCursorFill } from "react-icons/bs";
import { COLORS } from '@/styles/common'
import {
  LANDING_DEMO_CLAIMED,
  LANDING_DEMO_CLAIMED_ITEMS,
  LANDING_DEMO_FRIENDS,
  LANDING_DEMO_ITEMS,
  LANDING_DEMO_WISHLISTS,
  LANDING_ALL_DEMO_WISHLISTS,
  isDemoWishlistMine,
  type LandingDemoItem,
  type LandingDemoWishlist,
} from '@/data/landingDemoData'

function toCarouselRow(w: LandingDemoWishlist) {
  return {
    id: w.id,
    name: w.name,
    color: w.color,
    thumbnail_type: 'icon' as const,
    thumbnail_icon: w.thumbnail_icon ?? null,
    thumbnail_image: null as string | null,
    demo_thumbnail_url: w.demo_thumbnail_url,
  }
}

export function LandingInteractiveDemo() {
  const router = useRouter()

  type Screen =
    | { view: 'home' }
    | { view: 'wishlist'; wishlistId: string }
    | { view: 'item'; wishlistId: string; itemId: string; fromHome?: boolean }

  const [screen, setScreen] = useState<Screen>({ view: 'home' })
  const [sortBy, setSortBy] = useState<SortOption>('none')
  const [isNameExpanded, setIsNameExpanded] = useState(false)
  const [, setUnusedMenuOpen] = useState(false)

  const demoWishlistMap = useMemo(() => new Map(LANDING_ALL_DEMO_WISHLISTS.map((w) => [w.id, w])), [])

  const demoItemById = useMemo(() => {
    const m = new Map<string, LandingDemoItem>()
    for (const arr of Object.values(LANDING_DEMO_ITEMS)) {
      for (const it of arr) m.set(it.id, it)
    }
    for (const it of LANDING_DEMO_CLAIMED_ITEMS) {
      m.set(it.id, it)
    }
    return m
  }, [])

  const claimedImageById = useMemo(() => new Map(LANDING_DEMO_CLAIMED.map((c) => [c.id, c.image_url])), [])

  const claimedSectionItems = useMemo(
    () =>
      LANDING_DEMO_CLAIMED.map((c) => ({
        id: c.id,
        name: c.name,
        price: c.price,
        owner_name: c.owner_name,
        color: c.color,
        wishlist_id: c.wishlist_id,
      })),
    []
  )

  const friendsCarousel = useMemo(() => LANDING_DEMO_FRIENDS.map(toCarouselRow), [])
  const myCarousel = useMemo(() => LANDING_DEMO_WISHLISTS.map(toCarouselRow), [])

  const noop = useCallback(() => {}, [])

  const openWishlist = (id: string) => {
    if (!demoWishlistMap.has(id)) return
    setSortBy('none')
    setScreen({ view: 'wishlist', wishlistId: id })
  }

  const goHome = () => {
    setSortBy('none')
    setScreen({ view: 'home' })
  }

  const openItem = (wishlistId: string, itemId: string, fromHome = false) => {
    setScreen(fromHome ? { view: 'item', wishlistId, itemId, fromHome: true } : { view: 'item', wishlistId, itemId })
  }

  const currentWishlistId = screen.view === 'home' ? undefined : screen.wishlistId
  const wl = currentWishlistId ? demoWishlistMap.get(currentWishlistId) : undefined

  const wishlistIdForList = screen.view === 'wishlist' ? screen.wishlistId : ''

  const listViewItems: DemoListItem[] = useMemo(() => {
    const list = wishlistIdForList ? (LANDING_DEMO_ITEMS[wishlistIdForList] ?? []) : []
    return list.map((d) => ({
      id: d.id,
      name: d.name,
      image: 'demo',
      price: d.price,
      priority: d.priority,
      created_at: d.created_at,
    }))
  }, [wishlistIdForList])

  const listItemsForGrid = wishlistIdForList ? (LANDING_DEMO_ITEMS[wishlistIdForList] ?? []) : []

  const resolveListItemImage = useCallback(
    (item: DemoListItem) => demoItemById.get(item.id)?.image_url,
    [demoItemById]
  )

  const activeWishlistId = screen.view === 'home' ? null : screen.wishlistId

  const demoItemDetail = screen.view === 'item' ? demoItemById.get(screen.itemId) : undefined

  const heroWishlistMine = screen.view === 'item' ? isDemoWishlistMine(screen.wishlistId) : false

  const ownershipMineWishlistScreen = screen.view === 'wishlist' ? isDemoWishlistMine(screen.wishlistId) : false

  const emptyMenus: MenuOption[] = []

  return (
    <Box display={{ base: 'none', md: 'block' }} w="full" maxW="7xl" mx="auto" py={6}>
      <Box mb={5}>
        <HStack justify="center" gap={1} fontSize="xs" color="whiteAlpha.600">
          <BsFillCursorFill />
          <Text>Check out our interactive demo</Text>
        </HStack>
      </Box>
      <Box
        borderRadius="xl"
        borderWidth="3px"
        borderColor="#000000"
        overflow="hidden"
        boxShadow="0 24px 80px rgba(0,0,0,0.45)"
      >
        <Flex
          bg="#070707"
          p={{ base: 3, lg: 4 }}
          gap={{ base: 3, lg: 4 }}
          align="stretch"
          h={{ base: 'min(660px, 80vh)', md: '680px', lg: '680px' }}
          maxH="80vh"
          minH={{ base: '560px', md: '620px' }}
        >
          <Box
            w="88px"
            flexShrink={0}
            minH={0}
            overflow="hidden"
            borderRadius="lg"
            bg="#141414"
            position="relative"
            zIndex={2}
          >
            <LandingDemoSidebar
              mine={LANDING_DEMO_WISHLISTS}
              friends={LANDING_DEMO_FRIENDS}
              onSelectWishlist={openWishlist}
              onDemoHome={goHome}
              activeWishlistId={activeWishlistId}
            />
          </Box>

          <Box flex={1} minW={0} minH={0} overflow="hidden" bg={COLORS.background} borderRadius="lg">
          {screen.view === 'home' && (
            <Flex direction="column" h="full" overflow="hidden">
              <Box flex="0 0 auto" overflow="hidden" pt={{ base: 3, md: 4 }} pb={{ base: 3, md: 5 }} mb={{ base: 1, md: 2 }}>
                <ClaimedItemsSection
                  items={claimedSectionItems}
                  onShowAll={noop}
                  hideShowAll
                  onItemClick={(item) => openItem(item.wishlist_id!, item.id, true)}
                  getItemImageUrl={(item) => claimedImageById.get(item.id)}
                  compact
                />
              </Box>
              <Flex flex="1" minH={0} direction="column" overflow="hidden">
                <Box flex="1" minH={0} overflow="hidden">
                  <WishlistCarousel
                    title="Friends Lists"
                    wishlists={friendsCarousel}
                    onShowAll={noop}
                    hideShowAll
                    hideArrowButtons
                    onWishlistClick={openWishlist}
                    compact
                  />
                </Box>
                <Box flex="1" minH={0} overflow="hidden">
                  <WishlistCarousel
                    title="My Lists"
                    wishlists={myCarousel}
                    onShowAll={noop}
                    hideShowAll
                    hideArrowButtons
                    onWishlistClick={openWishlist}
                    compact
                  />
                </Box>
              </Flex>
            </Flex>
          )}

          {screen.view === 'wishlist' && wl && (
            <Flex direction="column" h="full" overflow="hidden">
              <Box flexShrink={0} overflow="hidden">
                {ownershipMineWishlistScreen ? (
                  <OwnerWishlistView
                    demoMode
                    compactHeader
                    onDemoBack={goHome}
                    wishlist={{
                      id: wl.id,
                      title: wl.name,
                      owner: 'You',
                      description: wl.description,
                      color: wl.color,
                      thumbnail_type: 'icon',
                      thumbnail_icon: wl.thumbnail_icon ?? null,
                      thumbnail_image: null,
                      demo_thumbnail_url: wl.demo_thumbnail_url,
                      item_count: listItemsForGrid.length,
                      owner_id: 'demo-owner',
                      is_public: true,
                      due_date: null,
                    }}
                    isSelectionMode={false}
                    setIsSelectionMode={noop}
                    selectedItems={[]}
                    setSelectedItems={noop}
                  />
                ) : (
                  <SharedWishlistView
                    demoMode
                    compactHeader
                    onDemoBack={goHome}
                    wishlist={{
                      id: wl.id,
                      title: wl.name,
                      owner_name: wl.owner_label ?? 'Friend',
                      owner_id: 'demo-friend',
                      description: wl.description,
                      color: wl.color,
                      thumbnail_type: 'icon',
                      thumbnail_icon: wl.thumbnail_icon ?? null,
                      thumbnail_image: null,
                      demo_thumbnail_url: wl.demo_thumbnail_url,
                      item_count: listItemsForGrid.length,
                      due_date: null,
                    }}
                  />
                )}
              </Box>
              <Box flex={1} minH={0} overflow="hidden">
                <WishlistFilters sortBy={sortBy} onSortChange={setSortBy} wishlistColor={wl.color} compact />
                <Box flex={1} minH={0} overflowY="auto" overflowX="hidden">
                  <WishlistItemView
                    items={listViewItems}
                    wishlistColor={wl.color}
                    sortBy={sortBy}
                    onItemClick={(item) => openItem(wl.id, item.id)}
                    resolveItemImageUrl={resolveListItemImage}
                    compact
                  />
                </Box>
              </Box>
            </Flex>
          )}

          {screen.view === 'item' && demoItemDetail && wl && (
            <Box h="full" overflow="hidden">
              <ItemDetailContent
                item={{
                  id: demoItemDetail.id,
                  name: demoItemDetail.name,
                  description: demoItemDetail.description,
                  price: demoItemDetail.price ?? null,
                  url: demoItemDetail.url ?? null,
                  image: demoItemDetail.image_url,
                }}
                wishlistColor={wl.color}
                imageSrc={demoItemDetail.image_url}
                wishlistInfo={
                  !heroWishlistMine && wl.owner_label ? { ownerName: wl.owner_label, name: wl.name } : null
                }
                isOwner={heroWishlistMine}
                isLoggedIn={false}
                onBack={() =>
                  screen.view === 'item' && screen.fromHome
                    ? goHome()
                    : setScreen({ view: 'wishlist', wishlistId: demoItemDetail.wishlist_id })
                }
                readOnly
                allowReadOnlyUrlOpen
                compact
                isMenuOpen={false}
                setIsMenuOpen={setUnusedMenuOpen}
                menuOptions={emptyMenus}
                isNameExpanded={isNameExpanded}
                setIsNameExpanded={setIsNameExpanded}
              />
            </Box>
          )}
          </Box>
        </Flex>
      </Box>

    </Box>
  )
}
