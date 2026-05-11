'use client'

import { Box } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'

/**
 * Thin sticky bar at bottom for GuestLayout on mobile.
 * Fills the area where MobileNav would be for logged-in users,
 * preventing the iOS color fade when guests view shared wishlists.
 */
export default function GuestMobileNavBar() {
  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      h="20px"
      minH="20px"
      bg={COLORS.background}
      zIndex={50}
      display={{ base: 'block', md: 'none' }}
      pb="env(safe-area-inset-bottom)"
    />
  )
}
