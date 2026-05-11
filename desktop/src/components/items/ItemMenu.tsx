import { Box, Button, VStack, Text, Separator } from '@chakra-ui/react'
import { LuPencil, LuShare2, LuTrash2 } from 'react-icons/lu'
import { COLORS } from '../../styles/common'

interface MenuOption {
  label: string
  icon: React.ElementType
  onClick: () => void
  variant?: 'danger'
}

interface ItemMenuProps {
  isOpen: boolean
  onClose: () => void
  options: MenuOption[]
}

export function ItemMenu({ isOpen, onClose, options }: ItemMenuProps) {
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

// Helper function to get item menu options
export function getItemMenuOptions(handlers: {
  onEdit: () => void
  onShare: () => void
  onDelete: () => void
}) {
  return [
    { label: 'Edit Item', icon: LuPencil, onClick: handlers.onEdit },
    { label: 'Share Item', icon: LuShare2, onClick: handlers.onShare },
    { label: 'Delete Item', icon: LuTrash2, onClick: handlers.onDelete, variant: 'danger' as const },
  ]
}