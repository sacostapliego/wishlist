'use client'

import { Box, HStack, IconButton } from '@chakra-ui/react'
import { LuPlus, LuX } from 'react-icons/lu'
import { GoHome, GoHomeFill } from 'react-icons/go'
import { BiGift, BiSolidGift } from 'react-icons/bi'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef } from 'react'
import { COLORS } from '../../styles/common'
import { MobileCreateMenu } from './nav/MobileCreateMenu'
import { CreateWishlistModal } from '../wishlists/CreateWishlistModal'
import { AddItemModal } from '../items/AddItemModal'

export default function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [isCreateWishlistModalOpen, setIsCreateWishlistModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const createButtonRef = useRef<HTMLButtonElement>(null)

  const isActive = (path: string) => pathname === path

  const navItems = [
    {
      label: 'Home',
      activeIcon: GoHomeFill,
      inactiveIcon: GoHome,
      active: isActive('/'),
      onClick: () => router.push('/'),
    },
    {
      label: 'Create',
      activeIcon: LuX,
      inactiveIcon: LuPlus,
      active: isCreateMenuOpen,
      ref: createButtonRef,
      onClick: () => setIsCreateMenuOpen(!isCreateMenuOpen),
    },
    {
      label: 'Claimed',
      activeIcon: BiSolidGift,
      inactiveIcon: BiGift,
      active: isActive('/items/claimed'),
      onClick: () => router.push('/items/claimed?fromMobileNav=true'),
    },
  ]

  return (
    <>
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        h="60px"
        bg="#141414"
        zIndex={100}
        display={{ base: 'flex', md: 'none' }}
        alignItems="center"
        justifyContent="center"
        px={4}
        pb="env(safe-area-inset-bottom)"
      >
        <HStack w="100%" justify="space-around" align="center">
          {navItems.map((item) => {
            const Icon = item.active ? item.activeIcon : item.inactiveIcon

            return (
              <IconButton
                key={item.label}
                aria-label={item.label}
                variant="ghost"
                color={item.active ? 'white' : COLORS.text.muted}
                size="2xl"
                ref={item.ref}
                onClick={item.onClick}
                _hover={{ bg: 'whiteAlpha.100' }}
              >
                <Icon fontSize={'2xl'} />
              </IconButton>
            )
          })}
        </HStack>
      </Box>

      <MobileCreateMenu
        isOpen={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
        anchorRef={createButtonRef}
        onCreateWishlist={() => {
          setIsCreateMenuOpen(false)
          setIsCreateWishlistModalOpen(true)
        }}
        onAddItem={() => {
          setIsCreateMenuOpen(false)
          setIsAddItemModalOpen(true)
        }}
      />

      <CreateWishlistModal
        isOpen={isCreateWishlistModalOpen}
        onClose={() => setIsCreateWishlistModalOpen(false)}
        onSuccess={() => setIsCreateWishlistModalOpen(false)}
      />

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
      />
    </>
  )
}