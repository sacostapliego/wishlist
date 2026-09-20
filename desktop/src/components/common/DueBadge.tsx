import { Text } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import { formatCountdown, getDueUrgency } from '../../utils/wishlistUtils'

interface DueBadgeProps {
  due_date?: string | null
  size?: 'sm' | 'md'
}

/**
 * Countdown chip for a wishlist due date.
 * Renders nothing when the list is undated or the date has passed — an
 * explicit "no date" chip is noise on a card.
 */
export function DueBadge({ due_date, size = 'sm' }: DueBadgeProps) {
  const label = formatCountdown(due_date)
  const urgency = getDueUrgency(due_date)

  if (!label || !urgency) return null

  const isSoon = urgency === 'soon'

  return (
    <Text
      as="span"
      flexShrink={0}
      fontSize={size === 'sm' ? '11px' : 'xs'}
      fontWeight="semibold"
      lineHeight="1.4"
      whiteSpace="nowrap"
      color={isSoon ? '#F2758A' : COLORS.text.muted}
      bg={isSoon ? 'rgba(196,30,58,0.16)' : 'rgba(255,255,255,0.06)'}
      px={size === 'sm' ? 2 : 2.5}
      py={size === 'sm' ? '2px' : 1}
      borderRadius="full"
    >
      {label}
    </Text>
  )
}

export default DueBadge
