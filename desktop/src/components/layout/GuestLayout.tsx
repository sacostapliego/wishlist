'use client'

import type { ReactNode } from 'react'
import { Box } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import GuestMobileNavBar from './GuestMobileNavBar'

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Box
        minH="100vh"
        h="100vh"
        overflowY="auto"
        overflowX="hidden"
        className="scroll-container-ios"
        bg={COLORS.background}
        pb={{ base: 'calc(20px + env(safe-area-inset-bottom))', md: 0 }}
      >
        {children}
      </Box>
      <GuestMobileNavBar />
    </>
  )
}