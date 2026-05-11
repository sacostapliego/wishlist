'use client'

import { useState, useEffect } from 'react'
import { Box, VStack, Button, Text } from '@chakra-ui/react'
import { createPortal } from 'react-dom'
import { LuList, LuPlus } from 'react-icons/lu'
import { COLORS } from '../../../styles/common'

interface CreateMenuProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
  onCreateWishlist: () => void
  onAddItem: () => void
}

export function CreateMenu({ isOpen, onClose, anchorRef, onCreateWishlist, onAddItem }: CreateMenuProps) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      setAnchorRect(anchorRef.current.getBoundingClientRect())
    }
  }, [isOpen, anchorRef])

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

      {/* Menu */}
      <Box
        position="fixed"
        top={anchorRect ? `${anchorRect.bottom + 8}px` : '50%'}
        left={anchorRect ? `${anchorRect.left}px` : '50%'}
        bg={COLORS.cardDarkLight}
        borderRadius="lg"
        p={2}
        zIndex={10000}
        minW="250px"
        boxShadow="0 4px 20px rgba(0,0,0,0.5)"
      >
        <VStack align="stretch" gap={1}>
          <Button
            variant="ghost"
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
            variant="ghost"
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
