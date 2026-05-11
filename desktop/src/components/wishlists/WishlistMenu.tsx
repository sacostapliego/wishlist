import { Box, Button, VStack, Text, Separator } from '@chakra-ui/react'
import { LuPencil , LuSquareCheck , LuShare2, LuTrash2, LuUserPlus, LuBookmark, LuBookmarkX, LuLogIn } from 'react-icons/lu'
import { COLORS } from '../../styles/common'

interface MenuOption {
  label: string
  icon: React.ElementType
  onClick: () => void
  variant?: 'danger'
}

interface WishlistMenuProps {
  isOpen: boolean
  onClose: () => void
  options: MenuOption[]
}

interface SharedMenuConfig {
  onAddFriend?: () => void
  onSaveWishlist?: () => void
  onRemoveSaved?: () => void
  onCreateAccount?: () => void
  onSignIn?: () => void
}


export function WishlistMenu({ isOpen, onClose, options }: WishlistMenuProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0, 0, 0, 0.7)"
        zIndex={999}
        onClick={onClose}
      />

      {/* Menu */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        bg={COLORS.cardDarkLight}
        borderRadius="lg"
        p={4}
        zIndex={1000}
        minW="300px"
        maxW="90vw"
      >
        <VStack align="stretch" gap={4}>
          {options.map((option, index) => {
            const IconComponent = option.icon
            return (
              <Box key={index}>
                {option.variant === 'danger' && index > 0 && (
                  <Separator mb={4}/>
                )}
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={() => {
                    option.onClick()
                    onClose()
                  }}
                  color={option.variant === 'danger' ? COLORS.error : 'white'}
                  _hover={{
                    bg: option.variant === 'danger' ? 'rgba(239, 68, 68, 0.1)' : COLORS.cardGray,
                  }}
                  size="lg"
                  w="100%"
                >
                  <Box as={IconComponent} mr={3} />
                  <Text>{option.label}</Text>
                </Button>
              </Box>
            )
          })}
        </VStack>
      </Box>
    </>
  )
}

// Helper function to get owner menu options
export function getOwnerMenuOptions(handlers: {
  onEdit: () => void
  onSelectItems: () => void
  onShare: () => void
  onDelete: () => void
}) {
  return [
    { label: 'Edit', icon: LuPencil, onClick: handlers.onEdit },
    { label: 'Select Items', icon: LuSquareCheck, onClick: handlers.onSelectItems },
    { label: 'Share Wishlist', icon: LuShare2, onClick: handlers.onShare },
    { label: 'Delete Wishlist', icon: LuTrash2, onClick: handlers.onDelete, variant: 'danger' as const },
  ]
}

// Helper function to get shared wishlist menu options
export function getSharedMenuOptions(config: SharedMenuConfig): MenuOption[] {
  const options: MenuOption[] = []

  // Guest options
  if (config.onCreateAccount) {
    options.push({
      label: 'Create Account',
      icon: LuUserPlus,
      onClick: config.onCreateAccount,
    })
  }

  if (config.onSignIn) {
    options.push({
      label: 'Sign In',
      icon: LuLogIn,
      onClick: config.onSignIn,
    })
  }

  // Authenticated user options
  if (config.onAddFriend) {
    options.push({
      label: 'Add Friend',
      icon: LuUserPlus,
      onClick: config.onAddFriend,
    })
  }

  if (config.onSaveWishlist) {
    options.push({
      label: 'Save Wishlist',
      icon: LuBookmark,
      onClick: config.onSaveWishlist,
    })
  }

  if (config.onRemoveSaved) {
    options.push({
      label: 'Remove Saved',
      icon: LuBookmarkX,
      onClick: config.onRemoveSaved,
    })
  }

  return options
}