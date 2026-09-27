'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Box, HStack, VStack, Text, IconButton, Avatar } from '@chakra-ui/react'
import { LuBell, LuUserPlus, LuClock } from 'react-icons/lu'
import { COLORS } from '../../styles/common'

const SEEN_KEY = 'home-notifications-seen'

export interface HomeNotification {
  id: string
  kind: 'friend-request' | 'due-soon'
  title: string
  subtitle: string
  href: string
}

interface HomeHeaderProps {
  displayName: string
  profileImage: string | null
  notifications: HomeNotification[]
  onNavigate: (href: string) => void
}

/**
 * Seen-notification ids live in localStorage and are read through
 * useSyncExternalStore, so the server render (no storage) and the client
 * render stay consistent. Writes notify locally because the browser's
 * `storage` event only fires in OTHER tabs.
 */
const seenListeners = new Set<() => void>()

function subscribeSeen(onChange: () => void) {
  seenListeners.add(onChange)
  window.addEventListener('storage', onChange)
  return () => {
    seenListeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getSeenSnapshot(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? ''
  } catch {
    return ''
  }
}

function getSeenServerSnapshot(): string {
  return ''
}

function writeSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids))
  } catch {
    // Storage unavailable (private mode) — the dot just stays live.
  }
  seenListeners.forEach((listener) => listener())
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function NotificationMenu({
  isOpen,
  onClose,
  anchorRef,
  notifications,
  onNavigate,
}: {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
  notifications: HomeNotification[]
  onNavigate: (href: string) => void
}) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      setAnchorRect(anchorRef.current.getBoundingClientRect())
    }
  }, [isOpen, anchorRef])

  if (!isOpen) return null

  return createPortal(
    <>
      <Box position="fixed" top={0} left={0} right={0} bottom={0} zIndex={9999} onClick={onClose} />

      <Box
        position="fixed"
        top={anchorRect ? `${anchorRect.bottom + 8}px` : '50%'}
        left={anchorRect ? `${Math.max(anchorRect.right - 320, 16)}px` : '50%'}
        w="320px"
        bg={COLORS.cardDarkLight}
        borderRadius="lg"
        p={2}
        zIndex={10000}
        boxShadow="0 4px 20px rgba(0,0,0,0.5)"
      >
        {notifications.length === 0 ? (
          <Text fontSize="sm" color={COLORS.text.muted} p={3}>
            Nothing needs you right now.
          </Text>
        ) : (
          <VStack align="stretch" gap={0}>
            {notifications.map((notification) => (
              <HStack
                key={notification.id}
                gap={3}
                p={3}
                borderRadius="md"
                cursor="pointer"
                _hover={{ bg: 'rgba(255,255,255,0.06)' }}
                onClick={() => {
                  onNavigate(notification.href)
                  onClose()
                }}
              >
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="md"
                  flexShrink={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg={notification.kind === 'friend-request' ? 'rgba(115,88,224,0.22)' : 'rgba(196,30,58,0.18)'}
                >
                  <Box
                    as={notification.kind === 'friend-request' ? LuUserPlus : LuClock}
                    boxSize="16px"
                    color={notification.kind === 'friend-request' ? '#a692ff' : '#F2758A'}
                  />
                </Box>
                <VStack align="start" gap={0} minW={0}>
                  <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
                    {notification.title}
                  </Text>
                  <Text fontSize="xs" color={COLORS.text.subtle} lineClamp={1}>
                    {notification.subtitle}
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </>,
    document.body
  )
}

/**
 * Desktop home header: greeting, notifications, avatar.
 *
 * Notifications are derived on the client from data the page already loads —
 * pending friend requests and friends' lists coming due — so this needs no
 * events table. Unread state is the set of notification ids already seen.
 */
export function HomeHeader({ displayName, profileImage, notifications, onNavigate }: HomeHeaderProps) {
  const bellRef = useRef<HTMLButtonElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const seenRaw = useSyncExternalStore(subscribeSeen, getSeenSnapshot, getSeenServerSnapshot)
  const seen = useMemo<string[]>(() => {
    try {
      return seenRaw ? (JSON.parse(seenRaw) as string[]) : []
    } catch {
      return []
    }
  }, [seenRaw])

  const unseenCount = notifications.filter((n) => !seen.includes(n.id)).length

  const handleToggle = () => {
    const opening = !isMenuOpen
    setIsMenuOpen(opening)

    if (opening) {
      writeSeen(notifications.map((n) => n.id))
    }
  }

  return (
    <HStack
      display={{ base: 'none', md: 'flex' }}
      px={8}
      h="72px"
      gap={4}
      color={COLORS.text.primary}
    >
      <Text fontSize="22px" fontWeight="bold">
        {greeting()}, {displayName}
      </Text>

      <Box flex="1" />

      <Box position="relative">
        <IconButton
          ref={bellRef}
          aria-label="Notifications"
          variant="ghost"
          borderRadius="full"
          onClick={handleToggle}
        >
          <LuBell />
        </IconButton>
        {unseenCount > 0 && (
          <Box
            position="absolute"
            top="8px"
            right="9px"
            w="8px"
            h="8px"
            borderRadius="full"
            bg={COLORS.primary}
            border="2px solid"
            borderColor={COLORS.background}
            pointerEvents="none"
          />
        )}
      </Box>

      <Avatar.Root size="sm" cursor="pointer" onClick={() => onNavigate('/profile')}>
        <Avatar.Fallback name={displayName} />
        <Avatar.Image src={profileImage || undefined} />
      </Avatar.Root>

      <NotificationMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        anchorRef={bellRef}
        notifications={notifications}
        onNavigate={onNavigate}
      />
    </HStack>
  )
}

export default HomeHeader
