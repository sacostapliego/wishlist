import { Box, Heading, HStack, Button, Text, IconButton, Image } from '@chakra-ui/react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useRef, useState } from 'react'
import { COLORS } from '../../styles/common'
import { resolveWishlistThumbnail } from '../../utils/wishlistIcons'

interface Wishlist {
  id: string
  name: string
  image?: string
  color?: string
  thumbnail_type?: 'icon' | 'image'
  thumbnail_icon?: string | null
  thumbnail_image?: string | null
}

interface WishlistCarouselProps {
  title: string
  wishlists: Wishlist[]
  onShowAll?: () => void
  onWishlistClick?: (wishlistId: string) => void
}

// Extracted scroll button component - no performance issues
interface ScrollButtonProps {
  direction: 'left' | 'right'
  onClick: () => void
  isVisible: boolean
}

function ScrollButton({ direction, onClick, isVisible }: ScrollButtonProps) {
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
      size="md"
      opacity={isVisible ? 1 : 0}
      transition="opacity 0.2s"
      pointerEvents={isVisible ? 'auto' : 'none'}
      aria-label={`Scroll ${direction}`}
    >
      {direction === 'left' ? <FaChevronLeft /> : <FaChevronRight />}
    </IconButton>
  )
}

export function WishlistCarousel({ title, wishlists, onShowAll, onWishlistClick }: WishlistCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <Box mb={{base: 1, md:1}}>
      <HStack justifyContent="space-between" px={{ base: 4, md: 8 }} >
        <Heading size="lg" color="white">{title}</Heading>
        <Button color={COLORS.text.muted} bg={COLORS.background} fontWeight={"bolder"} fontSize="sm" onClick={onShowAll}>
          Show all
        </Button>
      </HStack>
      
      <Box 
        position="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ScrollButton 
          direction="left" 
          onClick={() => scroll('left')} 
          isVisible={isHovered} 
        />

        <HStack
          ref={scrollRef}
          overflowX="auto"
          gap={{base: 1, md:4}}
          css={{
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}
          pb={2}
          pl={{base: 3, md: 8}}
        >
          {wishlists.map((wishlist) => {
            const thumbnail = resolveWishlistThumbnail(wishlist)
            
            return (
              <Box
                key={wishlist.id}
                w={{base:"10rem", md:"12rem", lg:"13rem"}}
                flexShrink={0}
                borderRadius="md"
                p={4}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ bg: '#2a2a2a' }}
                onClick={() => onWishlistClick?.(wishlist.id)}
                display="flex"
                flexDirection="column"
                gap={2}
              >
                <Box 
                  w="100%"
                  aspectRatio={1}
                  overflow="hidden" 
                  borderRadius="md" 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                  bg={wishlist.color || COLORS.cardGray}
                >
                  {thumbnail.type === 'image' ? (
                    <Image src={thumbnail.url} alt={wishlist.name} w="100%" h="100%" objectFit="cover" />
                  ) : (
                    <Box as={thumbnail.icon} boxSize="5rem" color="white" />
                  )}
                </Box>
                <Box>
                  <Text color="white" fontWeight="semibold" fontSize={{base:"sm", md:"md", lg:"lg"}} lineClamp={1}>
                    {wishlist.name}
                  </Text>
                </Box>
              </Box>
            )
          })}
        </HStack>

        <ScrollButton 
          direction="right" 
          onClick={() => scroll('right')} 
          isVisible={isHovered} 
        />
      </Box>
    </Box>
  )
}