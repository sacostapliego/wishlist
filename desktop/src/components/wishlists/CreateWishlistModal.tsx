'use client'

import { Box, Heading, IconButton } from '@chakra-ui/react'
import { LuX } from 'react-icons/lu'
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { WishlistForm } from './WishlistForm'
import type { WishlistFormRef } from './WishlistForm'
import { COLORS } from '../../styles/common'
import wishlistAPI from '../../services/wishlist'
import { toaster } from '../ui/toaster'
import type { CreateWishlistData } from '../../types/types'

interface CreateWishlistModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateWishlistModal({ isOpen, onClose, onSuccess }: CreateWishlistModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const formRef = useRef<WishlistFormRef>(null)
  const router = useRouter()

  const handleCreateWishlist = async (wishlistData: CreateWishlistData) => {
    setIsLoading(true)
    try {
      const result = await wishlistAPI.createWishlist({
        title: wishlistData.title,
        description: wishlistData.description,
        is_public: wishlistData.is_public,
        color: wishlistData.color,
        image: wishlistData.image,
        thumbnail_type: wishlistData.thumbnail_type,
        thumbnail_icon: wishlistData.thumbnail_icon,
        thumbnail_image: wishlistData.thumbnail_image,
        use_item_colors: wishlistData.use_item_colors,
        default_view: wishlistData.default_view,
        due_date: wishlistData.due_date,
      })
      
      if (formRef.current) {
        formRef.current.resetForm()
      }
      
      toaster.create({
        title: 'Success',
        description: 'Wishlist created successfully!',
        type: 'success'
      })
      
      if (onSuccess) {
        onSuccess()
      }
      
      onClose()
      
      router.push(`/wishlist/${result.id}`)
    } catch (error) {
      console.error('Error creating wishlist:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to create wishlist. Please try again.',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
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
        bg={COLORS.cardDarkLight}
        borderRadius="lg"
        zIndex={999}
        maxW={{base:"100%", md:"600px"}}
        maxH="90vh"
        w="90vw"
        overflowY="auto"
      >
        {/* Header */}
        <Box
          position="sticky"
          top={0}
          bg={COLORS.cardDarkLight}
          borderBottom="1px solid"
          borderColor={COLORS.cardGray}
          px={6}
          py={4}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          zIndex={1}
        >
          <Heading color={COLORS.text.primary} size="lg">Create New Wishlist</Heading>
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
        <WishlistForm
          ref={formRef}
          onSubmit={handleCreateWishlist}
          isLoading={isLoading}
          submitLabel="Create Wishlist"
        />
      </Box>
    </>,
    document.body
  )
}