import { useState, useRef, useEffect } from 'react'
import { Box, Button, HStack, VStack, Heading, IconButton } from '@chakra-ui/react'
import { LuX } from 'react-icons/lu'
import { COLORS } from '../../styles/common'
import { createPortal } from 'react-dom'
import { wishlistAPI } from '../../services/wishlist'
import { toaster } from '../ui/toaster'
import { ItemForm, type ItemFormData, type ItemFormRef } from './ItemForm'
import { ScrapeUrlForm } from './ScrapeUrlForm'
import type { Wishlist } from '../../types/types'

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  preSelectedWishlistId?: string
  onSuccess?: () => void
}

type AddMode = 'manual' | 'link'

export function AddItemModal({ isOpen, onClose, preSelectedWishlistId, onSuccess }: AddItemModalProps) {
  const [addMode, setAddMode] = useState<AddMode>('manual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [loadingWishlists, setLoadingWishlists] = useState(true)
  const [selectedWishlistId, setSelectedWishlistId] = useState(preSelectedWishlistId || '')
  const [initialFormValues, setInitialFormValues] = useState<Partial<ItemFormData>>({
    name: '',
    description: '',
    price: '',
    url: '',
    priority: 0,
  })

  const itemFormRef = useRef<ItemFormRef>(null)

  useEffect(() => {
    if (isOpen) {
      if (preSelectedWishlistId) {
        setSelectedWishlistId(preSelectedWishlistId)
        setLoadingWishlists(false)
      } else {
        fetchWishlists()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preSelectedWishlistId])
  const fetchWishlists = async () => {
    try {
      setLoadingWishlists(true)
      const response = await wishlistAPI.getWishlists()
      setWishlists(response)

      if (!preSelectedWishlistId && response && response.length > 0) {
        setSelectedWishlistId(response[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch wishlists:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to load your wishlists.',
        type: 'error',
      })
    } finally {
      setLoadingWishlists(false)
    }
  }

  const handleScrapeSuccess = (data: Partial<ItemFormData>) => {
    setInitialFormValues(data)
    setAddMode('manual')
  }

  const handleAddItemSubmit = async (formData: ItemFormData, imageFile?: File | string) => {
    setIsSubmitting(true)
    try {
      const itemDataPayload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        url: formData.url?.trim() || null,
        priority: formData.priority || 0,
        wishlist_id: selectedWishlistId,
        is_purchased: false,
      }

      await wishlistAPI.createItem(itemDataPayload, imageFile)

      setInitialFormValues({
        name: '',
        description: '',
        price: '',
        url: '',
        priority: 0,
      })

      if (itemFormRef.current) {
        itemFormRef.current.resetForm()
      }

      toaster.create({
        title: 'Success',
        description: 'Item added to wishlist!',
        type: 'success',
      })

      onClose()

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error adding item:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to add item. Please try again.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleClose = () => {
    setAddMode('manual')
    setInitialFormValues({
      name: '',
      description: '',
      price: '',
      url: '',
      priority: 0,
    })
    onClose()
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
        onClick={handleClose}
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
        maxW={{ base: '100%', md: '600px' }}
        maxH="90vh"
        w="90vw"
        overflowY="auto"
      >
        {/* Header */}
        <Box
          position="sticky"
          top={0}
          bg={COLORS.cardGray}
          borderBottom="1px solid"
          borderColor={COLORS.cardDarkLight}
          px={6}
          py={4}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          zIndex={1}
        >
          <Heading color={COLORS.text.primary} size="lg">Add New Item</Heading>
          <IconButton
            aria-label="Close"
            variant="ghost"
            onClick={handleClose}
            size="sm"
          >
            <LuX />
          </IconButton>
        </Box>

        {/* Body */}
        <Box px={6} pb={6}>
          <VStack align="stretch" gap={6}>
            <HStack gap={2} w="100%">
              <Button
                flex={1}
                variant={addMode === 'manual' ? 'solid' : 'outline'}
                onClick={() => setAddMode('manual')}
                bg={addMode === 'manual' ? COLORS.primary : undefined}
                color={addMode === 'manual' ? COLORS.text.primary : COLORS.text.secondary}
              >
                Manual
              </Button>
              <Button
                flex={1}
                variant={addMode === 'link' ? 'solid' : 'outline'}
                onClick={() => setAddMode('link')}
                bg={addMode === 'link' ? COLORS.primary : undefined}
                color={addMode === 'link' ? COLORS.text.primary : COLORS.text.secondary}
              >
                From Link
              </Button>
            </HStack>

            <Box>
              {addMode === 'manual' ? (
                <ItemForm
                  ref={itemFormRef}
                  initialValues={initialFormValues}
                  onSubmit={handleAddItemSubmit}
                  isLoading={isSubmitting}
                  submitLabel="Add Item"
                  wishlists={wishlists}
                  selectedWishlistId={selectedWishlistId}
                  onWishlistChange={setSelectedWishlistId}
                  loadingWishlists={loadingWishlists}
                  isEditMode={false}
                  hideWishlistSelector={!!preSelectedWishlistId}
                />
              ) : (
                <ScrapeUrlForm onScrapeSuccess={handleScrapeSuccess} />
              )}
            </Box>
          </VStack>
        </Box>
      </Box>
    </>,
    document.body
  )
}