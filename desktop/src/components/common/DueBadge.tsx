import { Text } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import { formatCountdown, getDueUrgency } from '../../utils/wishlistUtils'

interface DueBadgeProps {
  due_date?: string | null
  size?: 'sm' | 'md'
}

/**
 * Whether DueBadge will actually render for this date — callers that draw a
 * separator next to it need to know before laying the row out.
 */
export function hasDueCountdown(due_date?: string | null): boolean {
  return Boolean(formatCountdown(due_date) && getDueUrgency(due_date))
}

/**
 * Countdown for a wishlist due date.
 * Urgency is carried by the text colour alone — an enclosing pill turned every
 * card footer into a row of competing ovals.
 *
 * Renders nothing when the list is undated or the date has passed; an explicit
 * "no date" label is noise on a card.
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
      color={isSoon ? '#F2758A' : COLORS.text.subtle}
    >
      {label}
    </Text>
  )
}

export default DueBadge
