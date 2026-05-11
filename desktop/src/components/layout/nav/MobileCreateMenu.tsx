import { Box, VStack, Button, Text } from '@chakra-ui/react'
import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'
import { LuList, LuPlus } from 'react-icons/lu'
import { COLORS } from '../../../styles/common'

interface MobileCreateMenuProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
  onCreateWishlist: () => void
  onAddItem: () => void
}

export function MobileCreateMenu({ isOpen, onClose, anchorRef, onCreateWishlist, onAddItem }: MobileCreateMenuProps) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      setAnchorRect(anchorRef.current.getBoundingClientRect())
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={9999}
        onClick={onClose}
      />

      {/* Menu — positioned above the button */}
      <Box
        position="fixed"
        bottom={anchorRect ? `${window.innerHeight - anchorRect.top + 8}px` : '80px'}
        left={'50%'}
        transform="translateX(-50%)"
        bg={COLORS.cardDarkLight}
        borderRadius="lg"
        p={2}
        zIndex={10000}
        minW="200px"
        boxShadow="0 -4px 20px rgba(0,0,0,0.5)"
      >
        <VStack align="stretch" gap={1}>
          <Button
            justifyContent="flex-start"
            onClick={() => {
              onCreateWishlist()
              onClose()
            }}
            size="lg"
          >
            <Box as={LuList} mr={3} />
            <Text>Create Wishlist</Text>
          </Button>

          <Button
            justifyContent="flex-start"
            onClick={() => {
              onAddItem()
              onClose()
            }}
            size="lg"
          >
            <Box as={LuPlus} mr={3} />
            <Text>Add Item to Wishlist</Text>
          </Button>
        </VStack>
      </Box>
    </>,
    document.body
  )
}