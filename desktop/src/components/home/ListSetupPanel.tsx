'use client'

import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import { DueBadge } from '../common/DueBadge'
import { formatItemCount } from '../../utils/wishlistUtils'

/** Rows past this are counted, not drawn — the rail is not a list page. */
const MAX_ROWS = 5

export interface UnfinishedList {
  id: string
  name: string
  color?: string
  due_date?: string | null
  itemCount: number
}

/**
 * What a list is missing, in the order the viewer would fix it.
 * An empty list is the worse failure: a friend who opens it has nothing to
 * claim, whereas a dated-but-undated list merely never surfaces.
 */
function missingLabel(list: UnfinishedList): string {
  const noItems = list.itemCount === 0
  const noDate = !list.due_date

  if (noItems && noDate) return 'No items, no date'
  if (noItems) return 'No items yet'
  return 'No date set'
}

function SetupRow({ list, onOpen }: { list: UnfinishedList; onOpen: (id: string) => void }) {
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
      onClick={() => onOpen(list.id)}
      aria-label={`${list.name}, ${missingLabel(list)}`}
    >
      <Box flexShrink={0} w="3px" alignSelf="stretch" borderRadius="full" bg={list.color || COLORS.primary} />
      <Box flex="1" minW={0}>
        <Text fontSize="sm" fontWeight="semibold" color="white" lineClamp={1}>
          {list.name}
        </Text>
        <Text fontSize="xs" color={COLORS.text.subtle} lineClamp={1}>
          {list.itemCount > 0 ? formatItemCount(list.itemCount) : missingLabel(list)}
        </Text>
      </Box>
      <HStack gap={2} flexShrink={0}>
        {list.itemCount > 0 && (
          <Text fontSize="xs" color={COLORS.text.muted} whiteSpace="nowrap">
            {missingLabel(list)}
          </Text>
        )}
        <DueBadge due_date={list.due_date} />
      </HStack>
    </HStack>
  )
}

/**
 * Your own lists that aren't ready yet — no items on them, or no date.
 *
 * This is the one thing about your own lists that home can tell you and the
 * sidebar can't: the sidebar names every list you own, but not which of them a
 * friend would open and find nothing to claim. It stays on the "what needs my
 * attention" side of the line because every row is a repair, not a browse —
 * and the section disappears entirely once there is nothing left to fix.
 *
 * An undated list is a real consequence, not a style note: it never reaches Up
 * Next, the Upcoming calendar, or the bell, all of which key on the date.
 */
export function ListSetupPanel({
  lists,
  onOpenList,
}: {
  lists: UnfinishedList[]
  onOpenList: (id: string) => void
}) {
  const visible = lists.slice(0, MAX_ROWS)
  const overflow = lists.length - visible.length

  return (
    <Box bg={COLORS.cardDarkLight} borderRadius="lg" p={4} h="100%">
      <HStack justifyContent="space-between" mb={3} minH="1.75rem">
        <Heading size="md" color="white">
          Finish Setting Up
        </Heading>
        <Text fontSize="xs" color={COLORS.text.muted}>
          {lists.length} {lists.length === 1 ? 'list' : 'lists'}
        </Text>
      </HStack>

      <VStack align="stretch" gap={0}>
        {visible.map((list) => (
          <SetupRow key={list.id} list={list} onOpen={onOpenList} />
        ))}
      </VStack>

      {overflow > 0 && (
        <Text fontSize="xs" color={COLORS.text.muted} px={2} pt={2}>
          +{overflow} more to finish
        </Text>
      )}
    </Box>
  )
}

export default ListSetupPanel
