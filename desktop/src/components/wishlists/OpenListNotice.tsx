'use client'

import { Box, Button, Dialog, HStack, Text, VStack } from '@chakra-ui/react'
import { LuEye } from 'react-icons/lu'
import { useCallback, useSyncExternalStore } from 'react'
import { COLORS } from '../../styles/common'

const SEEN_KEY = 'open-list-notice-seen'

/**
 * Lists dismissed this session, whether or not storage accepted them.
 *
 * In private mode every localStorage call throws, and without this the notice
 * could not be dismissed at all: the dialog's open state is derived from what
 * has been seen, so if nothing can be recorded, nothing ever closes. Held in
 * memory it is forgotten on reload, which is the same "shows again next visit"
 * behaviour a failed write already gives.
 */
const seenThisSession = new Set<string>()

// Subscribers to the seen set. localStorage has no change event of its own for
// the tab that wrote it, so dismissing notifies them directly.
const listeners = new Set<() => void>()

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  // Another tab dismissing the same notice counts too.
  window.addEventListener('storage', onStoreChange)

  return () => {
    listeners.delete(onStoreChange)
    window.removeEventListener('storage', onStoreChange)
  }
}

/**
 * Tells a visitor, before they claim anything, that this list's owner can see
 * who claimed what.
 *
 * Most lists are blind — the owner is kept in the dark so the gift stays a
 * surprise — and a visitor reasonably assumes that. Claiming on an open list
 * without being told would mean the visitor gave away their own surprise
 * without ever agreeing to.
 *
 * Shown once per list per browser. Repeating it on every visit would train
 * people to dismiss it without reading, which is worse than not showing it.
 */
function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function hasSeen(wishlistId: string): boolean {
  return seenThisSession.has(wishlistId) || readSeen().includes(wishlistId)
}

function markSeen(wishlistId: string) {
  seenThisSession.add(wishlistId)

  try {
    const seen = readSeen()
    if (!seen.includes(wishlistId)) {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, wishlistId]))
    }
  } catch {
    // Storage unavailable (private mode). The notice just shows again next
    // visit, which is the safe direction to fail.
  }

  listeners.forEach((notify) => notify())
}

interface OpenListNoticeProps {
  wishlistId: string
  ownerName: string
  /** The owner doesn't need warning about their own list. */
  isOwner: boolean
  visibilityMode?: 'blind' | 'open'
}

export function OpenListNotice({
  wishlistId,
  ownerName,
  isOwner,
  visibilityMode,
}: OpenListNoticeProps) {
  // Whether this notice has been seen is external state that lives in the
  // browser, not React state, so it is read through useSyncExternalStore rather
  // than copied into a useState inside an effect. The server snapshot is
  // "already seen", which keeps the dialog closed during SSR and through
  // hydration - localStorage cannot be read on the server, and a first client
  // render that disagreed with the server's would be a hydration mismatch.
  const getSnapshot = useCallback(() => hasSeen(wishlistId), [wishlistId])
  const seen = useSyncExternalStore(subscribe, getSnapshot, () => true)

  const isOpen = !isOwner && visibilityMode === 'open' && !!wishlistId && !seen

  // Recording the dismissal notifies the store, which closes the dialog. There
  // is no separate open flag to keep in step with it.
  const dismiss = () => markSeen(wishlistId)

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && dismiss()} role="alertdialog">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content bg={COLORS.cardDarkLight} mx={4}>
          <Dialog.Body pt={6}>
            <VStack align="start" gap={4}>
              <HStack gap={3} align="start">
                <Box
                  w="40px"
                  h="40px"
                  borderRadius="full"
                  bg="rgba(196,30,58,0.18)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Box as={LuEye} boxSize="20px" color="#F2758A" />
                </Box>
                <VStack align="start" gap={1} minW={0}>
                  <Text fontWeight="semibold" color="white" fontSize="lg">
                    This list isn&apos;t a surprise
                  </Text>
                  <Text fontSize="sm" color={COLORS.text.secondary}>
                    {ownerName} can see who claimed each item on this list. If you claim
                    something, they&apos;ll know it&apos;s from you.
                  </Text>
                </VStack>
              </HStack>

              <Text fontSize="xs" color={COLORS.text.muted}>
                Most lists keep this hidden from their owner. This one is set to show it.
              </Text>
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <Button onClick={dismiss} bg={COLORS.primary} color="white" _hover={{ opacity: 0.9 }}>
              Got it
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}

export default OpenListNotice
