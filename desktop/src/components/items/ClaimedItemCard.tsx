'use client'

import { Box, HStack, VStack, Text, Image, IconButton, Spacer } from '@chakra-ui/react'
import { FaChevronRight } from 'react-icons/fa'
import { LuGift } from 'react-icons/lu'
import type { BoxProps } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import { DueBadge, hasDueCountdown } from '../common/DueBadge'
import getLightColor from '../common/getLightColor'

export interface ClaimedItem {
  id: string
  name: string
  /** Owner's note on the item — size, colour, "the 32GB one". */
  description?: string | null
  /** Nullable in the database, so this arrives as null, not absent. */
  price?: number | null
  image?: string
  owner_name: string
  color?: string
  wishlist_id?: string
  /** Due date of the list this item belongs to — drives the countdown. */
  wishlist_due_date?: string | null
}

interface ClaimedItemCardProps {
  item: ClaimedItem
  onOpen: (item: ClaimedItem) => void
  /** Resolved thumbnail src; empty string renders the gift placeholder. */
  imageUrl: string
  /** Tighter layout for framed previews / marketing demos. */
  compact?: boolean
  /** Thumbnail aspect ratio — the demo frame needs a letterbox, not a square. */
  thumbRatio?: number
  width?: BoxProps['width']
}

/** Hairline between the two footer facts — the quiet version of a " | ". */
function FooterRule() {
  return <Box w="1px" h="0.7rem" flexShrink={0} bg="rgba(255,255,255,0.18)" />
}

/**
 * One claimed gift: thumbnail on the list's colour, what it is, who it's for,
 * the owner's note, then price and countdown.
 *
 * Shared by the home carousel and the full /items/claimed grid so the two
 * surfaces cannot drift apart.
 */
export function ClaimedItemCard({
  item,
  onOpen,
  imageUrl,
  compact = false,
  thumbRatio = 1,
  width = '100%',
}: ClaimedItemCardProps) {
  // typeof, not truthiness: a genuinely free item is priced 0 and still shows it
  const price = typeof item.price === 'number' ? item.price : null

  return (
    <VStack
      align="stretch"
      gap={0}
      flexShrink={0}
      w={width}
      bg={COLORS.cardDarkLight}
      borderRadius="xl"
      p={compact ? 2 : 3}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ bg: '#2a2a2a' }}
      onClick={() => onOpen(item)}
    >
      {/* Thumbnail on the list's own colour, lightened — same treatment as the item views */}
      <Box
        w="100%"
        aspectRatio={thumbRatio}
        flexShrink={0}
        bg={getLightColor(item.color || COLORS.cardGray)}
        borderRadius="lg"
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={compact ? 1.5 : 2}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={item.name} maxW="100%" maxH="100%" objectFit="contain" draggable={false} />
        ) : (
          <Box as={LuGift} boxSize={compact ? '1.5rem' : '2.25rem'} color="whiteAlpha.800" />
        )}
      </Box>

      <Text
        mt={compact ? 2 : 3}
        color="white"
        fontWeight="bold"
        fontSize={compact ? '0.7rem' : 'sm'}
        lineHeight="1.3"
        lineClamp={1}
      >
        {item.name}
      </Text>
      <Text color={COLORS.text.subtle} fontSize={compact ? '0.58rem' : 'xs'} lineHeight="1.4" lineClamp={1}>
        For: {item.owner_name}
      </Text>

      {/*
        Fixed to exactly one line, present whether or not there is a description,
        so every card in a row or grid ends its footer on the same line.
      */}
      <Text
        mt={compact ? 1 : 1.5}
        h={compact ? '0.85rem' : '1.05rem'}
        color={COLORS.text.secondary}
        fontSize={compact ? '0.62rem' : 'xs'}
        lineHeight={compact ? '0.85rem' : '1.05rem'}
        lineClamp={1}
      >
        {item.description}
      </Text>

      <HStack mt={compact ? 2 : 2.5} gap={compact ? 1.5 : 2} minW={0}>
        {price !== null && (
          <Text
            flexShrink={0}
            fontSize={compact ? '10px' : '11px'}
            fontWeight="semibold"
            lineHeight="1.4"
            whiteSpace="nowrap"
            color={COLORS.text.primary}
          >
            ${price.toFixed(2)}
          </Text>
        )}
        {price !== null && hasDueCountdown(item.wishlist_due_date) && <FooterRule />}
        <DueBadge due_date={item.wishlist_due_date} />
        <Spacer />
        <IconButton
          size="xs"
          variant="ghost"
          borderRadius="full"
          flexShrink={0}
          color={COLORS.text.muted}
          bg="rgba(255,255,255,0.06)"
          _hover={{ bg: 'rgba(255,255,255,0.14)', color: 'white' }}
          aria-label={`Open ${item.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onOpen(item)
          }}
        >
          <FaChevronRight />
        </IconButton>
      </HStack>
    </VStack>
  )
}

export default ClaimedItemCard
