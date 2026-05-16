import { Box, Button, HStack, IconButton, Image, Text } from '@chakra-ui/react'
import { resolveWishlistThumbnail } from '../../../utils/wishlistIcons'
import { COLORS } from '../../../styles/common'

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
}: WishlistItemProps) {
  const thumbnail = resolveWishlistThumbnail({
    id,
    thumbnail_type,
    thumbnail_icon,
    thumbnail_image,
    image,
    demo_thumbnail_url,
  })

  const iconBox = thumbnail.type === 'image' ? (
    <Box
      w="35px"
      h="35px"
      borderRadius="sm"
      overflow="hidden"
      flexShrink={0}
      bg={color || COLORS.cardGray}
    >
      <Image src={thumbnail.url} alt={title} w="100%" h="100%" objectFit="cover" />
    </Box>
  ) : (
    <Box
      w="35px"
      h="35px"
      borderRadius="sm"
      bg={color || COLORS.cardGray}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box as={thumbnail.icon} boxSize="25px" />
    </Box>
  )

  if (isCollapsed) {
    return (
      <IconButton
        aria-label={title}
        variant="ghost"
        onClick={onClick}
        w="100%"
        {...(isActive
          ? { css: { boxShadow: '0 0 0 2px rgba(255,255,255,0.45)' }, bg: 'whiteAlpha.100' }
          : {})}
      >
        {iconBox}
      </IconButton>
    )
  }

  return (
    <Button
      variant="ghost"
      justifyContent="flex-start"
      onClick={onClick}
      size="sm"
      px={2}
    >
      <HStack>
        {iconBox}
        <Text fontSize="sm">
          {title}
        </Text>
      </HStack>
    </Button>
  )
}