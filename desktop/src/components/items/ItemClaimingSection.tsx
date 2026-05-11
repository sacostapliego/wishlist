import { Box, Button, HStack, Text, Input, Dialog } from '@chakra-ui/react'
import { LuCircleCheck, LuCircle } from 'react-icons/lu'
import { COLORS } from '../../styles/common'
import getLightColor from '../common/getLightColor'
import type { WishlistItem } from '../../types/types'

interface ItemClaimingSectionProps {
  item: WishlistItem
  wishlistColor?: string
  isItemClaimed: boolean
  canUserUnclaim: boolean
  isClaimLoading: boolean
  showGuestNameModal: boolean
  guestName: string
  setGuestName: (name: string) => void
  onClaimItem: () => void
  onUnclaimItem: () => void
  onGuestClaim: () => void
  onCancelGuestModal: () => void
}

export function ItemClaimingSection({
  item,
  wishlistColor,
  isItemClaimed,
  canUserUnclaim,
  isClaimLoading,
  showGuestNameModal,
  guestName,
  setGuestName,
  onClaimItem,
  onUnclaimItem,
  onGuestClaim,
  onCancelGuestModal,
}: ItemClaimingSectionProps) {
  const baseLightColor = getLightColor(wishlistColor || COLORS.cardGray)

  return (
    <>
      <Box>
        {isItemClaimed ? (
          <HStack
            p={4}
            borderRadius="lg"
            bg={baseLightColor}
            justify="space-between"
            align="center"
            gap={3}
          >
            <HStack gap={2} flex="1">
              <LuCircleCheck size={20} color={'white'} />
              <Text color={'white'} fontSize="md" fontWeight="medium">
                Claimed by {item.claimed_by_display_name || 'someone'}
              </Text>
            </HStack>
            {canUserUnclaim && (
              <Button
                variant="ghost"
                onClick={onUnclaimItem}
                disabled={isClaimLoading}
                color={'white'}
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                size="sm"
              >
                Unclaim
              </Button>
            )}
          </HStack>
        ) : (
          <Button
            w="100%"
            p={4}
            borderRadius="lg"
            bg={baseLightColor}
            onClick={onClaimItem}
            disabled={isClaimLoading}
            _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
            justifyContent="flex-start"
          >
            <HStack gap={2}>
              <LuCircle size={20} color={'white'} />
              <Text color={'white'} fontSize="md" fontWeight="medium">
                I'm getting this
              </Text>
            </HStack>
          </Button>
        )}
      </Box>

      {/* Guest Name Modal */}
      <Dialog.Root 
        open={showGuestNameModal} 
        onOpenChange={(e) => !e.open && onCancelGuestModal()}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Enter your name</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <Text color={COLORS.text.secondary} mb={4}>
                Let others know you're getting this item
              </Text>
              <Input
                placeholder="Your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                autoFocus
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onCancelGuestModal}>
                Cancel
              </Button>
              <Button
                onClick={onGuestClaim}
                disabled={isClaimLoading}
                bg={baseLightColor}
                color={COLORS.background}
                _hover={{ opacity: 0.9 }}
                ml={3}
              >
                Claim Item
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}