import { Box, Button, Text } from '@chakra-ui/react'
import type { ReactNode, RefObject } from 'react'
import { COLORS } from '../../../styles/common'

/**
 * Every sidebar row — nav, profile, wishlist, friend's wishlist — is built from
 * this one shell so the icon lands on the same pixel whether the sidebar is
 * expanded or collapsed. The two states used to be separate Button/IconButton
 * branches with different sizes and padding, which made the icons jump sideways
 * on every toggle.
 */

/** Icon slot. Matches the 35px wishlist thumbnails, which set the rhythm. */
export const SIDEBAR_ICON_SLOT = '35px'

/**
 * Horizontal padding inside a row. With the sidebar's own 12px padding this
 * puts a 35px icon's centre at 39.5px — all but dead centre of the 80px
 * collapsed rail, while staying flush left when expanded.
 */
export const SIDEBAR_ROW_PX = 2.5

export const SIDEBAR_ROW_H = '48px'

/**
 * Label timing is matched to the shell's own `width 0.2s`, so the text finishes
 * sliding exactly as the rail finishes narrowing rather than after it.
 */
const LABEL_TRANSITION = 'opacity 150ms ease, max-width 200ms ease, margin-left 200ms ease'

interface SidebarRowProps {
  icon: ReactNode
  label: string
  /** Second line, e.g. the owner of a friend's list. */
  secondary?: string
  isExpanded: boolean
  /** Omit for a non-interactive row, such as an empty-state placeholder. */
  onClick?: () => void
  /** Defaults to `label`; give it explicitly when the label alone is ambiguous. */
  ariaLabel?: string
  isActive?: boolean
  /** Dims the text for placeholder rows. */
  isMuted?: boolean
  /** Handed to the underlying button, for anchoring a popover to this row. */
  buttonRef?: RefObject<HTMLButtonElement | null>
  /**
   * Centres the icon and tightens the row, for the marketing demo's fixed
   * always-collapsed rail. The real sidebar must not use this: its icons stay
   * flush left so they don't move when the rail expands.
   */
  compact?: boolean
}

export function SidebarRow({
  icon,
  label,
  secondary,
  isExpanded,
  onClick,
  ariaLabel,
  isActive = false,
  isMuted = false,
  buttonRef,
  compact = false,
}: SidebarRowProps) {
  const rowH = compact ? '40px' : SIDEBAR_ROW_H
  const rowPx = compact ? 1 : SIDEBAR_ROW_PX
  const rowJustify = compact ? 'center' : 'flex-start'
  const content = (
    <>
      <Box
        w={SIDEBAR_ICON_SLOT}
        h={SIDEBAR_ICON_SLOT}
        flexShrink={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
      >
        {icon}
      </Box>

      {/*
        Collapsing to max-width 0 rather than unmounting: an unmounted label has
        no width to animate from, which is what made the toggle feel like a snap.
      */}
      <Box
        flex="1"
        minW={0}
        textAlign="left"
        overflow="hidden"
        pointerEvents="none"
        opacity={isExpanded ? 1 : 0}
        maxW={isExpanded ? '100%' : '0px'}
        ml={isExpanded ? 2 : 0}
        transition={LABEL_TRANSITION}
        aria-hidden={!isExpanded}
      >
        <Text
          fontSize="sm"
          fontWeight={secondary ? 'semibold' : 'medium'}
          color={isMuted ? COLORS.text.muted : COLORS.text.primary}
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {label}
        </Text>
        {secondary && (
          <Text
            fontSize="xs"
            color={COLORS.text.subtle}
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {secondary}
          </Text>
        )}
      </Box>
    </>
  )

  if (!onClick) {
    return (
      <Box
        display="flex"
        alignItems="center"
        w="100%"
        h={rowH}
        px={rowPx}
        justifyContent={rowJustify}
        overflow="hidden"
      >
        {content}
      </Box>
    )
  }

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="ghost"
      aria-label={ariaLabel ?? label}
      title={isExpanded ? undefined : (ariaLabel ?? label)}
      onClick={(event) => {
        event.preventDefault()
        onClick()
      }}
      w="100%"
      h={rowH}
      px={rowPx}
      gap={0}
      justifyContent={rowJustify}
      overflow="hidden"
      {...(isActive
        ? { css: { boxShadow: '0 0 0 2px rgba(255,255,255,0.45)' }, bg: 'whiteAlpha.100' }
        : {})}
    >
      {content}
    </Button>
  )
}

export default SidebarRow
