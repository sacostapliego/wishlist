'use client'

import { Box, HStack, VStack, Text, Image, Button } from '@chakra-ui/react'
import { LuChevronRight } from 'react-icons/lu'
import { COLORS } from '../../styles/common'
import { resolveWishlistThumbnail } from '../../utils/wishlistIcons'
import { formatCountdown, formatDueDate, formatItemCount } from '../../utils/wishlistUtils'
import type { UpNextGroup } from '../../utils/wishlistUtils'

/** Shape Up Next needs from a friend's wishlist, plus the viewer's own claim count. */
export interface UpNextList {
  id: string
  title: string
  ownerName: string
  color?: string
  image?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
  due_date?: string | null
  itemCount: number
  /** How many items on this list the viewer has claimed. */
  claimedByYou: number
}

const MAX_ROWS = 4

const DEFAULT_ACCENT = COLORS.primary

/** #rgb / #rrggbb -> [r, g, b], or null if it isn't a hex color. */
function parseHex(color: string): [number, number, number] | null {
  const hex = color.trim().replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}

/** Blend `amount` of `target` into `color`; both must be hex. */
function mix(color: string, target: string, amount: number): string {
  const a = parseHex(color)
  const b = parseHex(target)
  if (!a || !b) return color
  const [r, g, bl] = a.map((c, i) => Math.round(c + (b[i] - c) * amount))
  return `rgb(${r},${g},${bl})`
}

/**
 * The hero wash: the list's own color on the left, fading to a clearly lighter
 * tint of that same color on the right — never out to the page background.
 */
function heroGradient(accent: string): string {
  const light = mix(accent, '#ffffff', 0.45)
  return `linear-gradient(100deg, ${accent} 0%, ${light} 100%)`
}

interface UpNextHeroProps {
  group: UpNextGroup<UpNextList>
  /** Titles of the viewer's OWN lists sharing this date — mentioned, not given rows. */
  ownListTitles?: string[]
  onOpenList: (wishlistId: string) => void
}

function Thumbnail({ list, size }: { list: UpNextList; size: string }) {
  const thumbnail = resolveWishlistThumbnail(list)

  return (
    <Box
      w={size}
      h={size}
      flexShrink={0}
      borderRadius="md"
      overflow="hidden"
      bg={thumbnail.type === 'image' ? 'transparent' : list.color || COLORS.cardGray}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {thumbnail.type === 'image' ? (
        <Image src={thumbnail.url} alt={list.title} w="100%" h="100%" objectFit="cover" draggable={false} />
      ) : (
        <Box as={thumbnail.icon} boxSize={`calc(${size} / 2.4)`} color="white" />
      )}
    </Box>
  )
}

function ClaimProgress({ list, width }: { list: UpNextList; width?: string }) {
  const total = Math.max(list.itemCount, 0)
  const claimed = Math.min(list.claimedByYou, total)
  const pct = total > 0 ? Math.round((claimed / total) * 100) : 0

  return (
    <VStack align="stretch" gap={1.5} w={width} maxW={width}>
      <Box h="6px" borderRadius="full" bg="rgba(0,0,0,0.18)" overflow="hidden">
        <Box h="100%" w={`${pct}%`} borderRadius="full" bg={COLORS.white} transition="width 0.3s" />
      </Box>
      <Text fontSize="xs" color={COLORS.text.secondary}>
        {claimed === 0
          ? `${formatItemCount(total)} — you haven't claimed any yet`
          : `You've claimed ${claimed} of ${formatItemCount(total)}`}
      </Text>
    </VStack>
  )
}

function OwnListNote({ titles }: { titles: string[] }) {
  if (titles.length === 0) return null

  return (
    <Text fontSize="xs" color={COLORS.text.secondary} pt={1}>
      {titles.length === 1
        ? `Your list "${titles[0]}" is also due this day`
        : `${titles.length} of your own lists are also due this day`}
    </Text>
  )
}

/**
 * The nearest upcoming date.
 *
 * Keyed on the DATE rather than a single list: several friends can have a list
 * due on the same day (Christmas), and picking one of them arbitrarily would
 * hide the others. One list gets the full hero; several get a row each, sorted
 * so the person you have done the least for is on top.
 */
export function UpNextHero({ group, ownListTitles = [], onOpenList }: UpNextHeroProps) {
  const countdown = formatCountdown(group.dueDate)
  const dateLabel = formatDueDate(group.dueDate)

  const eyebrow = (
    <Text fontSize="11px" fontWeight="bold" letterSpacing="0.12em" color={COLORS.white}>
      UP NEXT{countdown ? ` · ${countdown.toUpperCase()}` : ''}
    </Text>
  )

  // Least-claimed first: the list nobody has shopped for is the one that needs attention.
  const sorted = [...group.lists].sort((a, b) => a.claimedByYou - b.claimedByYou)

  // One list: wear that list's own color. A shared date has no single owner, so it keeps the app accent.
  const accent = sorted.length === 1 ? sorted[0].color || DEFAULT_ACCENT : DEFAULT_ACCENT
  const heroBg = heroGradient(accent)

  if (sorted.length === 1) {
    const list = sorted[0]

    return (
      <Box px={{ base: 4, md: 8 }} pb={2}>
        <Box
          bg={heroBg}
          borderRadius="lg"
          p={{ base: 4, md: 5 }}
          display="flex"
          flexDirection={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'stretch', md: 'center' }}
          gap={{ base: 4, md: 5 }}
        >
          <Thumbnail list={list} size="128px" />

          <VStack align="stretch" gap={2.5} flex="1" minW={0}>
            {eyebrow}
            <Text fontSize={{ base: 'xl', md: '30px' }} fontWeight="bold" lineHeight="1.1" lineClamp={1}>
              {list.title}
            </Text>
            <Text fontSize="sm" color={COLORS.text.secondary} lineClamp={1}>
              {list.ownerName}
              {dateLabel ? ` · ${dateLabel}` : ''}
            </Text>
            <ClaimProgress list={list} width="420px" />
            <OwnListNote titles={ownListTitles} />
          </VStack>

          <Button
            bg={COLORS.cardDark}
            color="white"
            borderRadius="full"
            px={7}
            h="40px"
            fontWeight="bold"
            fontSize="sm"
            flexShrink={0}
            _hover={{ filter: 'brightness(1.6)' }}
            onClick={() => onOpenList(list.id)}
          >
            View list
          </Button>
        </Box>
      </Box>
    )
  }

  const visible = sorted.slice(0, MAX_ROWS)
  const overflow = sorted.length - visible.length

  return (
    <Box px={{ base: 4, md: 8 }} pb={2}>
      <Box bg={heroBg} borderRadius="lg" p={{ base: 4, md: 5 }}>
        <VStack align="stretch" gap={2}>
          {eyebrow}
          <HStack align="baseline" gap={3} flexWrap="wrap">
            <Text fontSize={{ base: 'xl', md: '30px' }} fontWeight="bold" lineHeight="1.1">
              {dateLabel}
            </Text>
            <Text fontSize="sm" color={COLORS.text.secondary}>
              {sorted.length} lists due this day
            </Text>
          </HStack>

          <VStack align="stretch" gap={1} pt={2}>
            {visible.map((list) => (
              <HStack
                key={list.id}
                gap={{ base: 3, md: 4 }}
                p={2}
                borderRadius="md"
                cursor="pointer"
                transition="background 0.2s"
                _hover={{ bg: 'rgba(255,255,255,0.06)' }}
                onClick={() => onOpenList(list.id)}
              >
                <Thumbnail list={list} size="48px" />

                <VStack align="start" gap={0} minW={0} flex={{ base: 1, md: '0 0 200px' }}>
                  <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
                    {list.ownerName}
                  </Text>
                  <Text fontSize="xs" color={COLORS.text.muted} lineClamp={1}>
                    {list.title}
                  </Text>
                </VStack>

                <Box flex="1" minW={0} display={{ base: 'none', md: 'block' }}>
                  <ClaimProgress list={list} />
                </Box>

                <Box as={LuChevronRight} boxSize="18px" color={COLORS.text.muted} flexShrink={0} />
              </HStack>
            ))}

            {overflow > 0 && (
              <Text fontSize="sm" color={COLORS.text.muted} px={2} pt={1}>
                +{overflow} more due {dateLabel}
              </Text>
            )}
          </VStack>

          <OwnListNote titles={ownListTitles} />
        </VStack>
      </Box>
    </Box>
  )
}

export default UpNextHero
