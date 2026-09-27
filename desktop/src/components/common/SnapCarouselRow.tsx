'use client'

import { Box, HStack, IconButton } from '@chakra-ui/react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react'

/**
 * Arrows are a pointer affordance. A touch device flicks the row directly, so
 * showing arrows there would only cover two cards with controls nobody uses.
 */
const POINTER_QUERY = '(hover: hover) and (pointer: fine)'

/** Slack for sub-pixel scroll positions when deciding "is there more this way". */
const EPSILON = 4

function useHasPointer() {
  const [hasPointer, setHasPointer] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(POINTER_QUERY)
    const sync = () => setHasPointer(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return hasPointer
}

interface ArrowProps {
  direction: 'left' | 'right'
  onClick: () => void
  isVisible: boolean
  size: 'sm' | 'md'
}

function ScrollArrow({ direction, onClick, isVisible, size }: ArrowProps) {
  return (
    <IconButton
      position="absolute"
      {...(direction === 'left' ? { left: 2 } : { right: 2 })}
      top="50%"
      transform="translateY(-50%)"
      zIndex={2}
      onClick={onClick}
      bg="rgba(0,0,0,0.7)"
      _hover={{ bg: 'rgba(0,0,0,0.9)' }}
      color="white"
      borderRadius="full"
      size={size}
      opacity={isVisible ? 1 : 0}
      transition="opacity 0.2s"
      pointerEvents={isVisible ? 'auto' : 'none'}
      tabIndex={isVisible ? 0 : -1}
      aria-hidden={!isVisible}
      aria-label={`Scroll ${direction}`}
    >
      {direction === 'left' ? <FaChevronLeft /> : <FaChevronRight />}
    </IconButton>
  )
}

interface SnapCarouselRowProps {
  children: ReactNode
  /**
   * Left/right gutter, as a CSS length. Doubles as scroll-padding so a snapped
   * card sits inside the gutter rather than flush against the viewport edge.
   */
  inset: { base: string; md: string }
  gap: { base: number; md: number }
  /** Hide the arrows entirely (small static demos). */
  hideArrows?: boolean
  arrowSize?: 'sm' | 'md'
  /** Re-measure the edges when this changes (e.g. the item count). */
  contentKey?: unknown
}

/**
 * Horizontal row of snap-aligned cards. On a pointer device the prev/next
 * arrows fade in on hover and advance roughly one screenful, landing on a card
 * boundary; on touch the row is scrolled directly and snaps onto a card.
 */
export function SnapCarouselRow({
  children,
  inset,
  gap,
  hideArrows = false,
  arrowSize = 'md',
  contentKey,
}: SnapCarouselRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasPointer = useHasPointer()
  const [isActive, setIsActive] = useState(false)
  const [edges, setEdges] = useState({ left: false, right: false })

  const syncEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setEdges({
      left: el.scrollLeft > EPSILON,
      right: el.scrollLeft < maxScroll - EPSILON,
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    syncEdges()
    const observer = new ResizeObserver(syncEdges)
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [syncEdges, contentKey])

  /**
   * Advance about one screenful, then fall back onto the nearest card start so
   * the arrow never leaves a card half-cut — and always move at least one card,
   * which matters when a single card is wider than the row.
   */
  const step = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return

    const children = Array.from(el.children) as HTMLElement[]
    if (children.length === 0) return

    const padLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0
    const starts = children.map((child) => child.offsetLeft - padLeft)
    const current = el.scrollLeft
    const target = direction === 'right' ? current + el.clientWidth : current - el.clientWidth

    const reachable =
      direction === 'right'
        ? starts.filter((start) => start > current + EPSILON)
        : starts.filter((start) => start < current - EPSILON)

    if (reachable.length === 0) {
      el.scrollTo({ left: direction === 'right' ? el.scrollWidth : 0, behavior: 'smooth' })
      return
    }

    const nearest = reachable.reduce((best, start) =>
      Math.abs(start - target) < Math.abs(best - target) ? start : best
    )
    el.scrollTo({ left: nearest, behavior: 'smooth' })
  }

  const showArrows = !hideArrows && hasPointer && isActive

  return (
    <Box
      position="relative"
      {...(!hideArrows
        ? {
            onMouseEnter: () => setIsActive(true),
            onMouseLeave: () => setIsActive(false),
            onFocus: () => setIsActive(true),
            onBlur: (event: FocusEvent<HTMLDivElement>) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsActive(false)
              }
            },
          }
        : {})}
    >
      <ScrollArrow
        direction="left"
        onClick={() => step('left')}
        isVisible={showArrows && edges.left}
        size={arrowSize}
      />

      <HStack
        ref={scrollRef}
        onScroll={syncEdges}
        position="relative"
        alignItems="stretch"
        overflowX="auto"
        gap={gap}
        pb={2}
        pl={inset}
        pr={inset}
        css={{
          scrollSnapType: 'x mandatory',
          scrollPaddingLeft: inset.base,
          overscrollBehaviorX: 'contain',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          '& > *': { scrollSnapAlign: 'start' },
          '@media (min-width: 48rem)': { scrollPaddingLeft: inset.md },
        }}
      >
        {children}
      </HStack>

      <ScrollArrow
        direction="right"
        onClick={() => step('right')}
        isVisible={showArrows && edges.right}
        size={arrowSize}
      />
    </Box>
  )
}
