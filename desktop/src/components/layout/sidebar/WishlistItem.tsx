import { Box, Image } from '@chakra-ui/react'
import { resolveWishlistThumbnail } from '../../../utils/wishlistIcons'
import { COLORS } from '../../../styles/common'
import { SidebarRow, SIDEBAR_ICON_SLOT } from './SidebarRow'

interface WishlistItemProps {
  id: string
  title: string
  color?: string
  image?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
  demo_thumbnail_url?: string | null
  isCollapsed: boolean
  onClick: () => void
  /** Highlights the row when this list is the active wishlist (e.g. marketing demo). */
  isActive?: boolean
  /** Centred, tighter row for the marketing demo's fixed collapsed rail. */
  compact?: boolean
}

export function WishlistItem({
  title,
  color,
  image,
  thumbnail_type,
  thumbnail_icon,
  thumbnail_image,
  isCollapsed,
  onClick,
  id,
  demo_thumbnail_url,
  isActive = false,
  compact = false,
}: WishlistItemProps) {
  const thumbnail = resolveWishlistThumbnail({
    id,
    thumbnail_type,
    thumbnail_icon,
    thumbnail_image,
    image,
    demo_thumbnail_url,
  })

  const iconBox =
    thumbnail.type === 'image' ? (
      <Box
        w={SIDEBAR_ICON_SLOT}
        h={SIDEBAR_ICON_SLOT}
        borderRadius="sm"
        overflow="hidden"
        flexShrink={0}
        bg={color || COLORS.cardGray}
      >
        <Image src={thumbnail.url} alt={title} w="100%" h="100%" objectFit="cover" draggable={false} />
      </Box>
    ) : (
      <Box
        w={SIDEBAR_ICON_SLOT}
        h={SIDEBAR_ICON_SLOT}
        borderRadius="sm"
        bg={color || COLORS.cardGray}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Box as={thumbnail.icon} boxSize="25px" />
      </Box>
    )

  return (
    <SidebarRow
      icon={iconBox}
      label={title}
      isExpanded={!isCollapsed}
      onClick={onClick}
      isActive={isActive}
      compact={compact}
    />
  )
}
