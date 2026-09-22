'use client'

import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import { DUE_SOON_DAYS, daysUntil, formatItemCount, parseLocalDate } from '../../utils/wishlistUtils'

/** Soon-due accent, shared with DueBadge. */
const SOON_COLOR = '#F2758A'

export interface Occasion {
  /** Wishlist id — the row opens the list. */
  id: string
  title: string
  /** Raw due date; the row derives day, month and countdown from it. */
  due_date: string
  /** Display name of the owner, or null for the viewer's own list. */
  ownerName: string | null
  itemCount: number
  /** How many items on this list the viewer has already claimed. */
  claimedByYou: number
}

interface MonthGroup {
  key: string
  label: string
  occasions: Occasion[]
}

/**
 * Group into months in date order.
 *
 * The year is only spelled out when it isn't the current one — "December" is
 * unambiguous in November, "December 2026" is not.
 */
function groupByMonth(occasions: Occasion[]): MonthGroup[] {
  const thisYear = new Date().getFullYear()
  const groups: MonthGroup[] = []

  for (const occasion of occasions) {
    const due = parseLocalDate(occasion.due_date)
    if (!due) continue

    const key = `${due.getFullYear()}-${due.getMonth()}`
    const existing = groups.find((group) => group.key === key)

    if (existing) {
      existing.occasions.push(occasion)
      continue
    }

    const month = due.toLocaleDateString(undefined, { month: 'long' })
    groups.push({
      key,
      label: due.getFullYear() === thisYear ? month : `${month} ${due.getFullYear()}`,
      occasions: [occasion],
    })
  }

  return groups
}

function OccasionRow({ occasion, onOpen }: { occasion: Occasion; onOpen: (id: string) => void }) {
  const due = parseLocalDate(occasion.due_date)
  const days = daysUntil(occasion.due_date)
  const isSoon = days !== null && days <= DUE_SOON_DAYS

  // "You" rather than the viewer's own name: the rail is read in first person.
  const subtitle = [occasion.ownerName ?? 'You', formatItemCount(occasion.itemCount)].join(' · ')

  return (
    <HStack
      as="button"
      w="100%"
      textAlign="left"
      gap={3}
      px={2}
      py={2}
      borderRadius="md"
      cursor="pointer"
      transition="background 0.15s"
      _hover={{ bg: 'rgba(255,255,255,0.06)' }}
      onClick={() => onOpen(occasion.id)}
      aria-label={`${occasion.title}, ${subtitle}`}
    >
      <VStack gap={0} flexShrink={0} w="2rem" alignItems="center">
        <Text fontSize="lg" fontWeight="bold" lineHeight="1.1" color={isSoon ? SOON_COLOR : 'white'}>
          {due?.getDate()}
        </Text>
        <Text fontSize="10px" fontWeight="semibold" color={COLORS.text.muted} textTransform="uppercase">
          {due?.toLocaleDateString(undefined, { weekday: 'short' })}
        </Text>
      </VStack>

      <Box flex="1" minW={0}>
        <Text fontSize="sm" fontWeight="semibold" color="white" lineClamp={1}>
          {occasion.title}
        </Text>
        <Text fontSize="xs" color={COLORS.text.subtle} lineClamp={1}>
          {subtitle}
        </Text>
      </Box>

      {occasion.claimedByYou > 0 && (
        <Box
          flexShrink={0}
          boxSize="6px"
          borderRadius="full"
          bg={SOON_COLOR}
          title={`You've claimed ${formatItemCount(occasion.claimedByYou)}`}
        />
      )}
    </HStack>
  )
}

/**
 * The next few dated occasions across the viewer's own lists and their friends'.
 *
 * Dates live nowhere else on the page — the sidebar lists lists, and the hero
 * only ever carries the single nearest one. Deliberately an agenda rather than
 * a month grid: occasions are sparse, and a dot on a cell can't say whose
 * birthday it is.
 */
export function UpcomingAgenda({
  occasions,
  onOpenList,
}: {
  occasions: Occasion[]
  onOpenList: (id: string) => void
}) {
  const groups = groupByMonth(occasions)

  return (
    <Box bg={COLORS.cardDarkLight} borderRadius="lg" p={4} h="100%">
      <Heading size="md" color="white" mb={3}>
        Upcoming
      </Heading>

      {groups.length === 0 ? (
        <Text fontSize="sm" color={COLORS.text.muted}>
          No dates coming up. Lists without a date won&apos;t appear here.
        </Text>
      ) : (
        <VStack align="stretch" gap={3}>
          {groups.map((group) => (
            <Box key={group.key}>
              <Text
                fontSize="10px"
                fontWeight="bold"
                letterSpacing="0.08em"
                textTransform="uppercase"
                color={COLORS.text.muted}
                px={2}
                mb={1}
              >
                {group.label}
              </Text>
              <VStack align="stretch" gap={0}>
                {group.occasions.map((occasion) => (
                  <OccasionRow key={occasion.id} occasion={occasion} onOpen={onOpenList} />
                ))}
              </VStack>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  )
}

export default UpcomingAgenda
