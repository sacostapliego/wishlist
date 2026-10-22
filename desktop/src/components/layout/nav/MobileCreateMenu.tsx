import { Box, VStack, HStack, Text } from '@chakra-ui/react'
import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { LuList, LuGift } from 'react-icons/lu'
import { COLORS } from '../../../styles/common'

interface MobileCreateMenuProps {
  isOpen: boolean
  onClose: () => void
  onCreateWishlist: () => void
  onAddItem: () => void
}

interface SheetOptionProps {
  icon: React.ElementType
  title: string
  description: string
  onClick: () => void
}

function SheetOption({ icon, title, description, onClick }: SheetOptionProps) {
  return (
    <HStack
      as="button"
      gap={4}
      p={4}
      w="100%"
      textAlign="left"
      borderRadius="lg"
      cursor="pointer"
      _hover={{ bg: 'whiteAlpha.100' }}
      _active={{ bg: 'whiteAlpha.100' }}
      onClick={onClick}
    >
      <Box
        w="44px"
        h="44px"
        flexShrink={0}
        borderRadius="lg"
        bg="whiteAlpha.100"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box as={icon} boxSize="20px" />
      </Box>
      <VStack align="start" gap={0}>
        <Text fontWeight="semibold">{title}</Text>
        <Text fontSize="sm" color={COLORS.text.muted}>{description}</Text>
      </VStack>
    </HStack>
  )
}

/**
 * A sheet rising from the bottom edge, sitting just above the nav bar so the
 * create button stays visible to close it again — within thumb reach, and
 * full-width so neither choice is a small target.
 */
export function MobileCreateMenu({ isOpen, onClose, onCreateWishlist, onAddItem }: MobileCreateMenuProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Backdrop — stops above the nav bar, which sits at zIndex 100 */}
      <Box position="fixed" inset={0} zIndex={90} bg="blackAlpha.600" onClick={onClose} />

      <Box
        role="dialog"
        aria-label="Create"
        position="fixed"
        left={0}
        right={0}
        bottom="calc(60px + env(safe-area-inset-bottom, 0px))"
        zIndex={95}
        bg={COLORS.cardDarkLight}
        color={COLORS.text.primary}
        borderTopRadius="2xl"
        px={3}
        pt={3}
        pb={2}
        boxShadow="0 -8px 24px rgba(0,0,0,0.5)"
      >
        <VStack align="stretch" gap={1}>
          <SheetOption
            icon={LuList}
            title="New wishlist"
            description="Start a list for an occasion"
            onClick={onCreateWishlist}
          />
          <SheetOption
            icon={LuGift}
            title="Add an item"
            description="Put something on one of your lists"
            onClick={onAddItem}
          />
        </VStack>
      </Box>
    </>,
    document.body
  )
}
