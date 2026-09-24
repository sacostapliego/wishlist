'use client'

import { Box, Button, Heading, HStack, IconButton, Text, VStack } from '@chakra-ui/react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useMemo, useState } from 'react'
import { COLORS } from '../../styles/common'
import { DUE_SOON_DAYS, daysUntil, formatItemCount, parseLocalDate } from '../../utils/wishlistUtils'

/** Soon-due accent, shared with DueBadge. */
const SOON_COLOR = '#F2758A'

/** A cell is ~43px wide — past three dots they stop being countable. */
const MAX_DOTS = 3

/** Six rows always, so the widget doesn't change height as months change. */
const GRID_ROWS = 6

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export interface Occasion {
  /** Wishlist id — rows in the detail panel open the list. */
  id: string
  title: string
  /** Raw due date; always set, since undated lists never reach the calendar. */
  due_date: string
  /** Display name of the owner, or null for the viewer's own list. */
  ownerName: string | null
  itemCount: number
  /** How many items on this list the viewer has already claimed. */
  claimedByYou: number
  /** The list's colour, used for its dot and its rule in the detail panel. */
  color?: string
}

/** Stable per-day key. Month is 0-based, matching Date. */
function dayKey(year: number, month: number, day: number): string {
  return `${year}-${month}-${day}`
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

interface DayCell {
  date: Date
  /** False for the leading/trailing days borrowed from the adjacent months. */
  inMonth: boolean
  key: string
  occasions: Occasion[]
}

/**
 * The 6x7 grid for a month, padded out to whole weeks from the neighbouring
 * months so every row has seven cells.
 */
function buildGrid(month: Date, byDay: Map<string, Occasion[]>): DayCell[] {
  const first = startOfMonth(month)
  const gridStart = new Date(first)
  gridStart.setDate(1 - first.getDay())

  return Array.from({ length: GRID_ROWS * 7 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const key = dayKey(date.getFullYear(), date.getMonth(), date.getDate())

    return {
      date,
      key,
      inMonth: isSameMonth(date, month),
      occasions: byDay.get(key) ?? [],
    }
  })
}

function DayButton({
  cell,
  isToday,
  isSelected,
  onSelect,
}: {
  cell: DayCell
  isToday: boolean
  isSelected: boolean
  onSelect: (key: string) => void
}) {
  const hasOccasions = cell.occasions.length > 0
  const listCount = cell.occasions.length

  return (
    <VStack
      as={hasOccasions ? 'button' : 'div'}
      gap={0}
      py={1}
      borderRadius="md"
      minH="2.6rem"
      justifyContent="flex-start"
      cursor={hasOccasions ? 'pointer' : 'default'}
      bg={isSelected ? 'rgba(255,255,255,0.12)' : 'transparent'}
      transition="background 0.15s"
      _hover={hasOccasions && !isSelected ? { bg: 'rgba(255,255,255,0.06)' } : undefined}
      onClick={hasOccasions ? () => onSelect(cell.key) : undefined}
      aria-label={
        hasOccasions
          ? `${cell.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}, ${listCount} ${
              listCount === 1 ? 'list' : 'lists'
            }`
          : undefined
      }
      aria-current={isToday ? 'date' : undefined}
    >
      <Box
        w="1.5rem"
        h="1.5rem"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        // Today is a ring rather than a fill, so it can't be mistaken for the
        // selected day when the two are different.
        border={isToday ? '1px solid' : 'none'}
        borderColor={SOON_COLOR}
      >
        <Text
          fontSize="xs"
          fontWeight={hasOccasions ? 'bold' : 'medium'}
          lineHeight="1"
          color={!cell.inMonth ? 'rgba(255,255,255,0.25)' : hasOccasions ? 'white' : COLORS.text.muted}
        >
          {cell.date.getDate()}
        </Text>
      </Box>

      <HStack gap="2px" h="5px" mt="2px">
        {cell.occasions.slice(0, MAX_DOTS).map((occasion) => (
          <Box
            key={occasion.id}
            boxSize="4px"
            borderRadius="full"
            bg={occasion.color || COLORS.primary}
            opacity={cell.inMonth ? 1 : 0.4}
          />
        ))}
      </HStack>
    </VStack>
  )
}

function OccasionRow({ occasion, onOpen }: { occasion: Occasion; onOpen: (id: string) => void }) {
  const days = daysUntil(occasion.due_date)
  const isSoon = days !== null && days <= DUE_SOON_DAYS

  // "You" rather than the viewer's own name: the panel is read in first person.
  const subtitle = [occasion.ownerName ?? 'You', formatItemCount(occasion.itemCount)].join(' · ')

  return (
    <HStack
      as="button"
      w="100%"
      textAlign="left"
      gap={2}
      px={2}
      py={1.5}
      borderRadius="md"
      cursor="pointer"
      transition="background 0.15s"
      _hover={{ bg: 'rgba(255,255,255,0.06)' }}
      onClick={() => onOpen(occasion.id)}
      aria-label={`${occasion.title}, ${subtitle}`}
    >
      <Box flexShrink={0} w="3px" alignSelf="stretch" borderRadius="full" bg={occasion.color || COLORS.primary} />
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
          bg={isSoon ? SOON_COLOR : COLORS.text.muted}
          title={`You have claimed ${formatItemCount(occasion.claimedByYou)}`}
        />
      )}
    </HStack>
  )
}

/**
 * Month calendar of every upcoming occasion, yours and your friends'.
 *
 * Opens on the month of the nearest occasion rather than the current one: with
 * nothing dated for weeks, today's month is usually an empty grid, and an empty
 * grid is a worse first impression than a month you didn't ask for.
 *
 * Cells carry dots, not names — seven columns in this rail leaves roughly 43px
 * each, which is not a label. The day's lists are named in the panel beside the
 * grid, which also means a dense day (five lists on Christmas) costs no space.
 */
export function UpcomingCalendar({
  occasions,
  onOpenList,
}: {
  occasions: Occasion[]
  onOpenList: (id: string) => void
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, Occasion[]>()
    for (const occasion of occasions) {
      const due = parseLocalDate(occasion.due_date)
      if (!due) continue
      const key = dayKey(due.getFullYear(), due.getMonth(), due.getDate())
      map.set(key, [...(map.get(key) ?? []), occasion])
    }
    return map
  }, [occasions])

  /** Occasions arrive nearest-first, so the first one sets the opening month. */
  const nearestDate = occasions[0] ? parseLocalDate(occasions[0].due_date) : null

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(nearestDate ?? new Date()))
  const [selectedKey, setSelectedKey] = useState<string | null>(() =>
    nearestDate ? dayKey(nearestDate.getFullYear(), nearestDate.getMonth(), nearestDate.getDate()) : null
  )

  const today = new Date()
  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate())
  const grid = useMemo(() => buildGrid(viewMonth, byDay), [viewMonth, byDay])

  /**
   * Paging picks out the new month's first occasion, so the panel below always
   * has something in it and never keeps a selection from the month you left.
   */
  const goToMonth = (next: Date) => {
    setViewMonth(next)
    const firstWithOccasions = buildGrid(next, byDay).find((cell) => cell.inMonth && cell.occasions.length > 0)
    setSelectedKey(firstWithOccasions?.key ?? null)
  }

  const selectedCell = selectedKey ? grid.find((cell) => cell.key === selectedKey) : undefined
  const selectedOccasions = selectedCell?.occasions ?? []
  const isOnCurrentMonth = isSameMonth(viewMonth, today)
  const monthHasOccasions = grid.some((cell) => cell.inMonth && cell.occasions.length > 0)

  return (
    <Box bg={COLORS.cardDarkLight} borderRadius="lg" p={4} h="100%">
      <HStack justifyContent="space-between" mb={3} minH="1.75rem">
        <Heading size="md" color="white">
          Upcoming
        </Heading>
        {!isOnCurrentMonth && (
          <Button
            size="xs"
            variant="ghost"
            color={COLORS.text.muted}
            _hover={{ color: 'white', bg: 'rgba(255,255,255,0.08)' }}
            onClick={() => goToMonth(startOfMonth(today))}
          >
            Today
          </Button>
        )}
      </HStack>

      {/*
        Grid and detail side by side rather than stacked: stacked, the widget
        ran about 140px taller than the claimed row beside it and left an
        awkward gap. The detail column is a fixed width and always rendered,
        even with nothing selected, so the widget never changes size.
      */}
      <HStack align="stretch" gap={4}>
        <Box flex="1" minW={0}>
          <HStack justifyContent="space-between" mb={2}>
            <IconButton
              size="xs"
              variant="ghost"
              color={COLORS.text.muted}
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.08)' }}
              aria-label="Previous month"
              onClick={() => goToMonth(addMonths(viewMonth, -1))}
            >
              <FaChevronLeft />
            </IconButton>
            <Text fontSize="sm" fontWeight="bold" color="white">
              {viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
            <IconButton
              size="xs"
              variant="ghost"
              color={COLORS.text.muted}
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.08)' }}
              aria-label="Next month"
              onClick={() => goToMonth(addMonths(viewMonth, 1))}
            >
              <FaChevronRight />
            </IconButton>
          </HStack>

          <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap="2px">
            {WEEKDAYS.map((weekday, index) => (
              <Text
                key={`${weekday}-${index}`}
                fontSize="10px"
                fontWeight="bold"
                textAlign="center"
                color={COLORS.text.muted}
                pb={1}
              >
                {weekday}
              </Text>
            ))}
            {grid.map((cell) => (
              <DayButton
                key={cell.key}
                cell={cell}
                isToday={cell.key === todayKey}
                isSelected={cell.key === selectedKey}
                onSelect={setSelectedKey}
              />
            ))}
          </Box>
        </Box>

        <Box w="12rem" flexShrink={0} borderLeft="1px solid" borderColor="rgba(255,255,255,0.08)" pl={3}>
          {selectedCell && selectedOccasions.length > 0 ? (
            <>
              <Text
                fontSize="10px"
                fontWeight="bold"
                letterSpacing="0.08em"
                textTransform="uppercase"
                color={COLORS.text.muted}
                px={2}
                mb={1}
              >
                {selectedCell.date.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <VStack align="stretch" gap={0} maxH="16rem" overflowY="auto">
                {selectedOccasions.map((occasion) => (
                  <OccasionRow key={occasion.id} occasion={occasion} onOpen={onOpenList} />
                ))}
              </VStack>
            </>
          ) : (
            <Text fontSize="xs" color={COLORS.text.muted} px={2} pt={1}>
              {occasions.length === 0
                ? 'No dates coming up. Lists without a date do not appear here.'
                : monthHasOccasions
                  ? 'Pick a highlighted date to see what falls on it.'
                  : `Nothing in ${viewMonth.toLocaleDateString(undefined, { month: 'long' })}.`}
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  )
}

export default UpcomingCalendar
