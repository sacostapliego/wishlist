import { HStack, Button } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'
import type { SortOption } from './WishlistItemView'

interface WishlistFiltersProps {
  sortBy: SortOption
  onSortChange: (sortOption: SortOption) => void
  wishlistColor?: string
  compact?: boolean
}

export function WishlistFilters({ sortBy, onSortChange, wishlistColor, compact = false }: WishlistFiltersProps) {
  const activeColor = wishlistColor || COLORS.primary

  const filterButtons = [
    { value: 'price-low' as SortOption, label: '$ ↓' },
    { value: 'price-high' as SortOption, label: '$ ↑' },
    { value: 'priority-high' as SortOption, label: '! ↑' },
  ]

  const handleFilterClick = (filterValue: SortOption) => {
    // Toggle off if clicking the same filter, otherwise set new filter
    if (sortBy === filterValue) {
      onSortChange('none')
    } else {
      onSortChange(filterValue)
    }
  }

  const pad = compact ? { px: { base: 1, md: 2 }, py: { base: 2, md: 2 } } : { px: { base: 1, md: 8 }, py: { base: 2, md: 4 } }
  const btnSize = compact
    ? ({ base: 'xs' as const, md: 'xs' as const, lg: 'sm' as const })
    : ({ base: 'sm' as const, md: 'md' as const, lg: 'lg' as const })

  return (
    <HStack justifyContent={{ base: 'flex-end', md: 'flex-start' }} gap={compact ? 1 : 2} {...pad}>
      {filterButtons.map((filter) => (
        <Button
          key={filter.value}
          size={btnSize}
          bg={sortBy === filter.value ? activeColor : 'transparent'}
          color={sortBy === filter.value ? 'white' : COLORS.text.secondary}
          _hover={{
            bg: sortBy === filter.value ? activeColor : COLORS.cardDarkLight,
          }}
          onClick={() => handleFilterClick(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </HStack>
  )
}