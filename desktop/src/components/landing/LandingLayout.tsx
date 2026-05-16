'use client'

import { Box } from '@chakra-ui/react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LandingFooter } from '@/components/landing/LandingFooter'

interface LandingLayoutProps {
  children: React.ReactNode
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <Box bg="#141414" minH="100vh">
      <LandingHeader />
      <Box
        as="main"
        maxW="7xl"
        mx="auto"
        px={{ base: 4, md: 6 }}
        color="whiteAlpha.900"
      >
        {children}
      </Box>
      <LandingFooter />
    </Box>
  )
}
