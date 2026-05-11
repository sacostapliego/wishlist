import { Box, Heading, IconButton } from '@chakra-ui/react'
import { LuX } from 'react-icons/lu'
import { useState, useEffect, useRef } from 'react'
import { ItemForm, type ItemFormData, type ItemFormRef } from './ItemForm'
import { COLORS } from '../../styles/common'
import { wishlistAPI } from '../../services/wishlist'
import { toaster } from '../ui/toaster'
import { API_URL } from '../../services/api'
import { createPortal } from 'react-dom'

interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: string
  onSuccess?: () => void
}

export function EditItemModal({ isOpen, onClose, itemId, onSuccess }: EditItemModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [initialValues, setInitialValues] = useState<Partial<ItemFormData>>({})
  const formRef = useRef<ItemFormRef>(null)
    
  useEffect(() => {
    if (isOpen && itemId) {
      fetchItemDetails()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, itemId])

  const fetchItemDetails = async () => {
    setIsLoading(true)
    try {
      const itemData = await wishlistAPI.getWisihlistItem(itemId)
      setInitialValues({
        name: itemData.name,
        description: itemData.description || '',
        price: itemData.price !== undefined && itemData.price !== null ? String(itemData.price) : '',
        url: itemData.url || '',
        currentImageUri: itemData.image ? `${API_URL}wishlist/${itemData.id}/image` : undefined,
        priority: itemData.priority || 0,
      })
    } catch (error) {
      console.error('Error fetching item details:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to load item details',
        type: 'error'
      })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateItem = async (formData: ItemFormData, imageFile?: File | string) => {
    setIsSaving(true)
    try {
      const itemDataToUpdate = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        url: formData.url || undefined,
        priority: formData.priority,
      }

      // Remove undefined values
      Object.keys(itemDataToUpdate).forEach(key => {
        const k = key as keyof typeof itemDataToUpdate
        if (itemDataToUpdate[k] === undefined) {
          delete itemDataToUpdate[k]
        }
      })

      await wishlistAPI.updateItem(itemId, itemDataToUpdate, imageFile)
      
      toaster.create({
        title: 'Success',
        description: 'Item updated successfully!',
        type: 'success'
      })
      
      if (onSuccess) {
        onSuccess()
      }
      
      onClose()
    } catch (error) {
      console.error('Error updating item:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to update item',
        type: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

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
        bg="rgba(0, 0, 0, 0.7)"
        zIndex={999}
        onClick={onClose}
      />

      {/* Modal */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        bg={COLORS.cardGray}
        borderRadius="lg"
        zIndex={1000}
        w="90vw"
        maxW="600px"
        maxH="90vh"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Box
          px={6}
          py={4}
          borderBottom={`1px solid ${COLORS.cardDarkLight}`}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          zIndex={1}
        >
          <Heading size="lg">Edit Item</Heading>
          <IconButton
            aria-label="Close"
            variant="ghost"
            onClick={onClose}
            size="sm"
          >
            <LuX />
          </IconButton>
        </Box>

        {/* Form */}
        <Box overflowY="auto" flex="1" px={6} py={4}>
          {!isLoading && Object.keys(initialValues).length > 0 && (
            <ItemForm
              ref={formRef}
              initialValues={initialValues}
              onSubmit={handleUpdateItem}
              isLoading={isSaving}
              submitLabel="Save Changes"
              isEditMode={true}
            />
          )}
        </Box>
      </Box>
    </>,
    document.body
  )
}