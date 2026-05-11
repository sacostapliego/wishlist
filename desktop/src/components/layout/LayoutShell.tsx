'use client'

import { useAuth } from '@/context/AuthContext'
import ResponsiveLayout from '@/components/layout/ResponsiveLayout'
import GuestLayout from '@/components/layout/GuestLayout'
import { Box, Spinner } from '@chakra-ui/react'

type LayoutType = 'protected' | 'public' | 'none'

export function LayoutShell({ children, type }: { children: React.ReactNode; type: LayoutType }) {
  const { isLoggedIn, loading } = useAuth()

  if (type === 'none') return <>{children}</>

  if (type === 'protected') {
    if (loading) {
      return (
        <Box h="100vh" display="flex" alignItems="center" justifyContent="center" bg="#070707">
          <Spinner size="xl" color="blue.500" />
        </Box>
      )
    }
    return <ResponsiveLayout>{children}</ResponsiveLayout>
  }

  if (loading) return null
  if (isLoggedIn) return <ResponsiveLayout>{children}</ResponsiveLayout>
  return <GuestLayout>{children}</GuestLayout>
}
