'use client'

import { Box, VStack, HStack, Flex, Heading, Button, Text } from '@chakra-ui/react'
import { ClaimedItemsSection } from '../components/home/ClaimedItemSection'
import { WishlistCarousel } from '../components/home/WishlistCarousel'
import { UpNextHero, type UpNextList } from '../components/home/UpNextHero'
import { UpcomingAgenda, type Occasion } from '../components/home/UpcomingAgenda'
import { HomeHeader, type HomeNotification } from '../components/home/HomeHeader'
import { HomeSkeleton } from '../components/home/HomeSkeleton'
import { useEffect, useMemo, useState } from 'react'
import { wishlistAPI, type ClaimedItemResponse } from '../services/wishlist'
import { friendsAPI, type FriendWishlistResponse, type FriendRequestInfo } from '../services/friends'
import { toaster } from '../components/ui/toaster'
import { useRouter } from 'next/navigation'
import { ProfileHeader } from '../components/layout/ProfileHeader'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../services/api'
import { COLORS } from '../styles/common'
import {
  CLAIMED_HORIZON_DAYS,
  daysUntil,
  getUpNextGroup,
  isWishlistActive,
  isWishlistCurrent,
  isWithinDays,
} from '../utils/wishlistUtils'
import type { Wishlist as WishlistType } from '../types/types'

/** Days out at which a friend's list starts showing up in the bell. */
const NOTIFY_WITHIN_DAYS = 7

/** Rows in the Upcoming rail — enough to orient, short enough to sit beside the claimed row. */
const AGENDA_MAX_OCCASIONS = 5

interface Wishlist {
  id: string
  name: string
  image?: string
  color?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
  due_date?: string | null
  itemCount?: number
}

interface ClaimedItem {
  id: string
  name: string
  description?: string | null
  price?: number | null
  image?: string
  owner_name: string
  color?: string
  wishlist_id?: string
  wishlist_due_date?: string | null
}

function EmptySectionHeader({
  title,
  onShowAll,
  message,
}: {
  title: string
  onShowAll: () => void
  message?: string
}) {
  return (
    <Box px={{ base: 4, md: 8 }} minH={{ base: '5rem', md: '7rem' }} mb={2}>
      <HStack justifyContent="space-between">
        <Heading size="lg" color="white">{title}</Heading>
        <Button
          color={COLORS.text.muted}
          bg={COLORS.background}
          fontWeight="bolder"
          fontSize="sm"
          onClick={onShowAll}
        >
          Show all
        </Button>
      </HStack>
      <Box mt={4} color={COLORS.text.muted}>
        {message ?? `No ${title.toLowerCase()} to show.`}
      </Box>
    </Box>
  )
}

function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [myWishlists, setMyWishlists] = useState<Wishlist[]>([])
  const [friendsWishlists, setFriendsWishlists] = useState<FriendWishlistResponse[]>([])
  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequestInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [myWishlistsData, friendsWishlistsData, claimedItemsData, requestsData] = await Promise.all([
        wishlistAPI.getWishlists(),
        friendsAPI.getFriendsWishlists(),
        wishlistAPI.getClaimedItems(),
        friendsAPI.getFriendRequests().catch(() => [] as FriendRequestInfo[]),
      ])

      const transformedMyWishlists = myWishlistsData.map((wishlist: WishlistType) => ({
        id: wishlist.id,
        name: wishlist.title,
        image: wishlist.image,
        color: wishlist.color,
        thumbnail_type: wishlist.thumbnail_type,
        thumbnail_icon: wishlist.thumbnail_icon,
        thumbnail_image: wishlist.thumbnail_image,
        due_date: wishlist.due_date,
        itemCount: wishlist.item_count,
      }))

      const transformedClaimedItems = claimedItemsData
        .filter((item: ClaimedItemResponse) => isWishlistActive(item.wishlist_due_date))
        .sort(
          (a: ClaimedItemResponse, b: ClaimedItemResponse) =>
            (daysUntil(a.wishlist_due_date) ?? 0) - (daysUntil(b.wishlist_due_date) ?? 0)
        )
        .map((item: ClaimedItemResponse) => ({
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

      setMyWishlists(transformedMyWishlists)
      setFriendsWishlists(friendsWishlistsData)
      setClaimedItems(transformedClaimedItems)
      setFriendRequests(requestsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to load wishlists',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Claimed items shown on home are capped at the horizon: a gift for an
   * occasion months away isn't something to act on today. Everything stays
   * visible on /items/claimed, which lists Active and Inactive in full.
   */
  const visibleClaimedItems = useMemo(
    () => claimedItems.filter((item) => isWithinDays(item.wishlist_due_date, CLAIMED_HORIZON_DAYS)),
    [claimedItems]
  )

  const laterClaimedCount = claimedItems.length - visibleClaimedItems.length

  /**
   * Home shows the lists still ahead of you: upcoming or not yet dated.
   * Lists whose date has passed stay on /wishlists/mine.
   */
  const currentWishlists = useMemo(
    () => myWishlists.filter((wishlist) => isWishlistCurrent(wishlist.due_date)),
    [myWishlists]
  )

  /** Friends' lists get the same "still ahead of you" filter as your own. */
  const currentFriendsWishlists = useMemo(
    () =>
      friendsWishlists
        .filter((wishlist) => isWishlistCurrent(wishlist.due_date))
        .map((wishlist) => ({
          id: wishlist.id,
          name: wishlist.title,
          image: wishlist.image,
          color: wishlist.color,
          thumbnail_type: wishlist.thumbnail_type,
          thumbnail_icon: wishlist.thumbnail_icon,
          thumbnail_image: wishlist.thumbnail_image,
          due_date: wishlist.due_date,
          itemCount: wishlist.item_count,
          ownerName: wishlist.owner_name || wishlist.owner_username,
        })),
    [friendsWishlists]
  )

  /** How many items the viewer has claimed, per wishlist. */
  const claimsByWishlist = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of claimedItems) {
      if (!item.wishlist_id) continue
      counts.set(item.wishlist_id, (counts.get(item.wishlist_id) ?? 0) + 1)
    }
    return counts
  }, [claimedItems])

  /**
   * Every dated occasion ahead, yours and your friends', nearest first.
   *
   * The nearest one is also in the hero on purpose: the hero is the call to
   * action, the rail is orientation, and a rail that silently started at the
   * second date would read as though the first had been missed.
   */
  const upcomingOccasions = useMemo<Occasion[]>(() => {
    const own: Occasion[] = myWishlists
      .filter((wishlist) => isWishlistActive(wishlist.due_date))
      .map((wishlist) => ({
        id: wishlist.id,
        title: wishlist.name,
        due_date: wishlist.due_date as string,
        ownerName: null,
        itemCount: wishlist.itemCount ?? 0,
        claimedByYou: 0,
      }))

    const friends: Occasion[] = friendsWishlists
      .filter((wishlist) => isWishlistActive(wishlist.due_date))
      .map((wishlist) => ({
        id: wishlist.id,
        title: wishlist.title,
        due_date: wishlist.due_date as string,
        ownerName: wishlist.owner_name || wishlist.owner_username,
        itemCount: wishlist.item_count ?? 0,
        claimedByYou: claimsByWishlist.get(wishlist.id) ?? 0,
      }))

    return [...own, ...friends]
      .sort((a, b) => (daysUntil(a.due_date) ?? 0) - (daysUntil(b.due_date) ?? 0))
      .slice(0, AGENDA_MAX_OCCASIONS)
  }, [myWishlists, friendsWishlists, claimsByWishlist])

  /**
   * The nearest upcoming date among FRIENDS' lists.
   * Own lists are excluded on purpose: there is nothing to claim on your own
   * list, so it would be a different action sitting in the same row.
   */
  const upNext = useMemo(() => {
    const candidates: UpNextList[] = friendsWishlists.map((wishlist) => ({
      id: wishlist.id,
      title: wishlist.title,
      ownerName: wishlist.owner_name || wishlist.owner_username,
      color: wishlist.color,
      image: wishlist.image,
      thumbnail_type: wishlist.thumbnail_type,
      thumbnail_icon: wishlist.thumbnail_icon,
      thumbnail_image: wishlist.thumbnail_image,
      due_date: wishlist.due_date,
      itemCount: wishlist.item_count ?? 0,
      claimedByYou: claimsByWishlist.get(wishlist.id) ?? 0,
    }))

    return getUpNextGroup(candidates)
  }, [friendsWishlists, claimsByWishlist])

  /** Own lists falling on the same date — mentioned under the hero, not given rows. */
  const ownListsOnUpNextDate = useMemo(() => {
    if (!upNext) return []
    return myWishlists
      .filter((wishlist) => (wishlist.due_date ?? '').split('T')[0] === upNext.dueDate)
      .map((wishlist) => wishlist.name)
  }, [myWishlists, upNext])

  const notifications = useMemo<HomeNotification[]>(() => {
    const requests: HomeNotification[] = friendRequests.map((request) => ({
      id: `request-${request.id}`,
      kind: 'friend-request',
      title: request.name || request.username,
      subtitle: 'Sent you a friend request',
      href: '/friends',
    }))

    const dueSoon: HomeNotification[] = friendsWishlists
      .filter((wishlist) => {
        const days = daysUntil(wishlist.due_date)
        return days !== null && days >= 0 && days <= NOTIFY_WITHIN_DAYS
      })
      .map((wishlist) => ({
        id: `due-${wishlist.id}-${(wishlist.due_date ?? '').split('T')[0]}`,
        kind: 'due-soon' as const,
        title: `${wishlist.owner_name || wishlist.owner_username} — ${wishlist.title}`,
        subtitle:
          (claimsByWishlist.get(wishlist.id) ?? 0) === 0
            ? 'Coming up, nothing claimed yet'
            : 'Coming up this week',
        href: `/wishlist/${wishlist.id}`,
      }))

    return [...requests, ...dueSoon]
  }, [friendRequests, friendsWishlists, claimsByWishlist])

  if (isLoading) {
    return <HomeSkeleton />
  }

  const displayName = user?.name || user?.username || 'there'
  const profileImage = user?.id ? `${API_URL}users/${user.id}/profile-image` : null

  return (
    <Box
      h={{ base: 'calc(100vh + 80px)', md: 'calc(100vh - 32px)' }}
      w="100%"
      overflowX="visible"
      bg={COLORS.background}
      py={2}
    >
      <ProfileHeader />
      <HomeHeader
        displayName={displayName}
        profileImage={profileImage}
        notifications={notifications}
        onNavigate={(href) => router.push(href)}
      />

      <VStack align="stretch">
        {/* Up Next — the nearest date, grouped so a shared date (Christmas) shows everyone */}
        {upNext && (
          <UpNextHero
            group={upNext}
            ownListTitles={ownListsOnUpNextDate}
            onOpenList={(id) => router.push(`/wishlist/${id}`)}
          />
        )}

        {/*
          Items Claimed, with the Upcoming rail beside it.

          The rail is a fixed column rather than a filler for whatever space the
          claimed row leaves over — that space only exists at some widths and
          some item counts. It is gated to xl because below that it would cost
          the claimed row half its cards.
        */}
        <Flex align="stretch" gap={{ xl: 4 }}>
          <Box flex="1" minW={0}>
            {visibleClaimedItems.length > 0 ? (
              <ClaimedItemsSection
                items={visibleClaimedItems}
                onShowAll={() => router.push('/items/claimed')}
                onItemClick={(item) => router.push(`/wishlist/${item.wishlist_id}/${item.id}`)}
              />
            ) : (
              <EmptySectionHeader
                title="Items Claimed"
                onShowAll={() => router.push('/items/claimed')}
                message={
                  laterClaimedCount > 0
                    ? `Nothing due soon — ${laterClaimedCount} claimed for later dates.`
                    : undefined
                }
              />
            )}
          </Box>

          <Box
            display={{ base: 'none', xl: 'block' }}
            w="20rem"
            flexShrink={0}
            pr={8}
            pb={2}
          >
            <UpcomingAgenda
              occasions={upcomingOccasions}
              onOpenList={(id) => router.push(`/wishlist/${id}`)}
            />
          </Box>
        </Flex>

        {/* Your Lists — the sidebar is the real nav path, this is the overview */}
        {currentWishlists.length > 0 ? (
          <WishlistCarousel
            title="Your Lists"
            wishlists={currentWishlists}
            onShowAll={() => router.push('/wishlists/mine')}
            onWishlistClick={(id) => router.push(`/wishlist/${id}`)}
          />
        ) : (
          <EmptySectionHeader
            title="Your Lists"
            onShowAll={() => router.push('/wishlists/mine')}
            message={
              myWishlists.length > 0
                ? `No upcoming lists — ${myWishlists.length === 1 ? 'your list has' : `all ${myWishlists.length} of your lists have`} a date that's passed.`
                : undefined
            }
          />
        )}

        {/* Friends' Lists — a separate row because claiming is not managing */}
        {currentFriendsWishlists.length > 0 && (
          <WishlistCarousel
            title="Friends' Lists"
            wishlists={currentFriendsWishlists}
            onShowAll={() => router.push('/wishlists/friends')}
            onWishlistClick={(id) => router.push(`/wishlist/${id}`)}
          />
        )}

        {!upNext && friendsWishlists.length > 0 && (
          <Text px={{ base: 4, md: 8 }} fontSize="sm" color={COLORS.text.muted}>
            No occasions in the next two months. Your friends&apos; lists are in the sidebar.
          </Text>
        )}
      </VStack>
    </Box>
  )
}

export default HomePage
