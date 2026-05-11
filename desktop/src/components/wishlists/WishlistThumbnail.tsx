import { Box, Image } from '@chakra-ui/react'
import { resolveWishlistThumbnail } from '../../utils/wishlistIcons'
import type { SystemStyleObject } from '@chakra-ui/react'

interface WishlistThumbnailProps {
  wishlist: {
    thumbnail_type?: 'icon' | 'image'
    thumbnail_icon?: string | null
    thumbnail_image?: string | null
    image?: string
    color?: string
  }
  /** Size of the icon when rendering icon mode */
  iconSize?: string | Record<string, string>
  /** Box size props (w/h) */
  boxSize?: string | Record<string, string>
  /** Additional box styles */
  sx?: SystemStyleObject
  borderRadius?: string
  showBackground?: boolean
}

/**
 * Renders a wishlist thumbnail — either an uploaded image or a React icon.
 * Handles backward compatibility with legacy wishlists that only have `image` (icon key).
 */
export function WishlistThumbnail({
  wishlist,
  iconSize = '5rem',
  boxSize = '100%',
  sx,
  borderRadius = 'md',
  showBackground = true,
}: WishlistThumbnailProps) {
  const thumbnail = resolveWishlistThumbnail(wishlist)

  if (thumbnail.type === 'image') {
    return (
      <Box
        w={boxSize}
        h={boxSize}
        borderRadius={borderRadius}
        overflow="hidden"
        flexShrink={0}
        bg={wishlist.color || 'transparent'}
        css={sx}
      >
        <Image
          src={thumbnail.url}
          alt="Wishlist thumbnail"
          w="100%"
          h="100%"
          objectFit="cover"
        />
      </Box>
    )
  }

  const IconComponent = thumbnail.icon
  return (
    <Box
      w={boxSize}
      h={boxSize}
      borderRadius={borderRadius}
      bg={showBackground ? (wishlist.color || '#212121') : 'transparent'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      css={sx}
    >
      <Box as={IconComponent} boxSize={iconSize} color="white" />
    </Box>
  )
}
