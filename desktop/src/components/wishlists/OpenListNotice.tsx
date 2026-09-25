'use client'

import { Box, Button, Dialog, HStack, Text, VStack } from '@chakra-ui/react'
import { LuEye } from 'react-icons/lu'
import { useEffect, useState } from 'react'
import { COLORS } from '../../styles/common'

const SEEN_KEY = 'open-list-notice-seen'

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

function markSeen(wishlistId: string) {
  try {
    const seen = readSeen()
    if (!seen.includes(wishlistId)) {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, wishlistId]))
    }
  } catch {
    // Storage unavailable (private mode). The notice just shows again next
    // visit, which is the safe direction to fail.
  }
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
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOwner || visibilityMode !== 'open' || !wishlistId) return
    // Reading storage in an effect, not during render, so the server render and
    // the first client render agree.
    if (!readSeen().includes(wishlistId)) {
      setIsOpen(true)
    }
  }, [wishlistId, isOwner, visibilityMode])

  const dismiss = () => {
    markSeen(wishlistId)
    setIsOpen(false)
  }

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
