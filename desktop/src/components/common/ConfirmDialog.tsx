import { Dialog } from '@chakra-ui/react'
import { Button, Text } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  isDestructive?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  isDestructive = false
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="sm">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
          </Dialog.Header>
          
          <Dialog.Body>
            <Text color={COLORS.text.secondary}>{message}</Text>
          </Dialog.Body>

          <Dialog.Footer gap={3}>
            <Dialog.ActionTrigger asChild>
              <Button variant="outline" onClick={onClose}>
                {cancelText}
              </Button>
            </Dialog.ActionTrigger>
            <Button
              bg={isDestructive ? COLORS.error : COLORS.primary}
              color="white"
              onClick={handleConfirm}
              _hover={{
                opacity: 0.9
              }}
            >
              {confirmText}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}