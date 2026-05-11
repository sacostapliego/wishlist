import { useState } from 'react'
import { Box, Spinner } from '@chakra-ui/react'
import wishlistAPI from '../../services/wishlist'
import { toaster } from '../ui/toaster'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { COLORS } from '../../styles/common'

interface ItemSelectionManagerProps {
  selectedItems: string[]
  onItemsDeleted: () => void
  refetchItems: () => void
  confirmDeleteVisible: boolean
  setConfirmDeleteVisible: (visible: boolean) => void
}

export function ItemSelectionManager({
  selectedItems,
  onItemsDeleted,
  refetchItems,
  confirmDeleteVisible,
  setConfirmDeleteVisible
}: ItemSelectionManagerProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteSelectedItems = async () => {
    setConfirmDeleteVisible(false)
    setIsDeleting(true)
    
    try {
      // Delete each selected item
      for (const itemId of selectedItems) {
        await wishlistAPI.deleteItem(itemId)
      }
      
      refetchItems()
      onItemsDeleted()
      
      toaster.create({
        title: 'Success',
        description: `${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'items'} deleted`,
        type: 'success',
      })
    } catch (error) {
      console.error('Failed to delete items:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to delete some items',
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDeleteVisible}
        onClose={() => setConfirmDeleteVisible(false)}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'items'}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteSelectedItems}
        isDestructive
      />

      {isDeleting && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.7)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
        >
          <Spinner size="xl" color={COLORS.primary} />
        </Box>
      )}
    </>
  )
}