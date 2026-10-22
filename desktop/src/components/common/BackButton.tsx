'use client'

import { IconButton } from '@chakra-ui/react'
import { LuArrowLeft } from 'react-icons/lu'
import { useBackNavigation } from '../../hooks/useBackNavigation'

interface BackButtonProps {
  /** The page's logical parent, used when there is no in-app page to go back to. */
  fallback: string | null
  /**
   * For pages that are a bottom-nav tab on a phone. A tab is a starting point,
   * not a step in a trail, so it shows no back arrow there; the desktop
   * sidebar has no tabs, so the arrow stays.
   */
  isMobileTab?: boolean
  size?: 'md' | 'lg'
}

export function BackButton({ fallback, isMobileTab = false, size = 'lg' }: BackButtonProps) {
  const { canGoBack, goBack } = useBackNavigation(fallback)

  if (!canGoBack) return null

  return (
    <IconButton
      aria-label="Go back"
      variant="ghost"
      onClick={goBack}
      color="white"
      size={size}
      display={isMobileTab ? { base: 'none', md: 'inline-flex' } : undefined}
    >
      <LuArrowLeft />
    </IconButton>
  )
}
