'use client'

import type { ReactNode } from 'react'
import { Box } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import GuestMobileNavBar from './GuestMobileNavBar'

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Box
        /* 100dvh, written so browsers without `dvh` still get 100vh - see
           --toolbar-overlap in App.css. Sized to what is actually visible, so
           the end of the content is not left sitting under a browser toolbar. */
        minH="calc(100vh - var(--toolbar-overlap, 0px))"
        h="calc(100vh - var(--toolbar-overlap, 0px))"
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