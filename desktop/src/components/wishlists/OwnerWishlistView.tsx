'use client'

import { Box, HStack, VStack, Heading, Text, Avatar, IconButton, Button } from '@chakra-ui/react'
import { LuArrowLeft, LuEllipsisVertical, LuPlus } from 'react-icons/lu'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COLORS } from '../../styles/common'
import { API_URL } from '../../services/api'
import { WishlistMenu, getOwnerMenuOptions } from './WishlistMenu'
import { EditWishlistModal } from './EditWishlistModal'
import { AddItemModal } from '../items/AddItemModal'
import { ItemSelectionManager } from '../items/ItemSelectionManager'
import { toaster } from '../ui/toaster'
import { WishlistThumbnail } from './WishlistThumbnail'
import { wishlistAPI } from '../../services/wishlist'
import { ConfirmDialog } from '../common/ConfirmDialog'

interface OwnerWishlistViewProps {
  wishlist: {
    id: string
    title: string
    owner: string
    description?: string
    color?: string
    image?: string
    thumbnail_type?: 'icon' | 'image'
    thumbnail_icon?: string | null
    thumbnail_image?: string | null
    item_count?: number
    updated_at?: string
    created_at?: string
    owner_id?: string
    is_public?: boolean
    due_date?: string | null
  }
  onItemAdded?: () => void
  refetchItems?: () => void
  isSelectionMode: boolean
  setIsSelectionMode: (value: boolean) => void
  selectedItems: string[]
  setSelectedItems: (value: string[]) => void
}

export function OwnerWishlistView({ 
  wishlist, 
  onItemAdded, 
  refetchItems,
  isSelectionMode,
  setIsSelectionMode,
  selectedItems,
  setSelectedItems
}: OwnerWishlistViewProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isDeletingWishlist, setIsDeletingWishlist] = useState(false)
  const [showDeleteWishlistConfirm, setShowDeleteWishlistConfirm] = useState(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const profileImage = wishlist.owner_id ? `${API_URL}users/${wishlist.owner_id}/profile-image` : null

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/wishlist/${wishlist.id}`
      : `https://cardinalwishlist.vercel.app/wishlist/${wishlist.id}`
    try {
      if (!wishlist.is_public) {
        await wishlistAPI.updateWishlist(wishlist.id, { is_public: true })
        wishlist.is_public = true
      }

      await navigator.clipboard.writeText(shareUrl)
      toaster.create({
        title: 'Link Copied',
        description: 'Wishlist link copied to clipboard! Anyone with this link can view it.',
        type: 'success',
      })
    } catch (error) {
      console.error('Failed to share wishlist:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to share wishlist. Please try again.',
        type: 'error',
      })
    }
  }


  const handleDeleteWishlist = async () => {
    setIsDeletingWishlist(true)
    try {
      await wishlistAPI.deleteWishlist(wishlist.id)
      toaster.create({
        title: 'Wishlist Deleted',
        description: `"${wishlist.title}" has been deleted.`,
        type: 'success',
      })
      router.replace('/')
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete wishlist:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to delete wishlist. Please try again.',
        type: 'error',
      })
    } finally {
      setIsDeletingWishlist(false)
    }
  }

  const cancelSelection = () => {
    setIsSelectionMode(false)
    setSelectedItems([])
  }

  const menuOptions = getOwnerMenuOptions({
    onEdit: () => setIsEditModalOpen(true),
    onSelectItems: () => setIsSelectionMode(true),
    onShare: handleShare,
    onDelete: () => setShowDeleteWishlistConfirm(true),  // open confirm first
  })

  return (
    <Box bg={wishlist.color || COLORS.cardGray} px={{base:4, md:6}} py={6}>
      {/* Header with back button and menu */}
      <HStack justify="space-between" mb={4}>
        <IconButton
          aria-label="Go back"
          variant="ghost"
          onClick={() => router.back()}
          color="white"
          size="lg"
        >
          <LuArrowLeft />
        </IconButton>

        <HStack gap={2}>
          {!isSelectionMode && (
            <>
              <IconButton
                aria-label="Add item"
                variant="ghost"
                onClick={() => setIsAddItemModalOpen(true)}
                color="white"
                size="lg"
              >
                <LuPlus />
              </IconButton>

              <IconButton
                aria-label="Menu"
                variant="ghost"
                onClick={() => setIsMenuOpen(true)}
                color="white"
                size="lg"
              >
                <LuEllipsisVertical />
              </IconButton>
            </>
          )}

          {isSelectionMode && (
            <>
              <Button
                variant="ghost"
                onClick={cancelSelection}
                color="white"
              >
                Cancel
              </Button>
              <Button
                bg={COLORS.error}
                color="white"
                onClick={() => setDeleteConfirmVisible(true)}
                disabled={selectedItems.length === 0}
                _hover={{
                  opacity: 0.9
                }}
              >
                Delete ({selectedItems.length})
              </Button>
            </>
          )}
        </HStack>
      </HStack>

      <HStack align="flex-end" gap={6}>
        {/* Wishlist Icon */}
        <WishlistThumbnail
          wishlist={wishlist}
          boxSize={{ base: "9rem", md: "13rem", lg: "15rem", '2xl': "17rem" }}
          iconSize={{ base: "5rem", md: "6rem", lg: "8rem", '2xl': "10rem" }}
          sx={{ boxShadow: '0 4px 60px rgba(0,0,0,0.5)' }}
          showBackground={false}
        />

        {/* Wishlist Info */}
        <VStack align="start" gap={2} pb={4}>
          <Heading 
            size={{ base: "xl", md: "3xl", lg: "4xl" }} 
            color="white"
            lineHeight="1.2"
            wordBreak="break-word"
          >
            {wishlist.title}
          </Heading>
          
          {wishlist.description && (
            <Text color={COLORS.text.secondary} fontSize="sm" mt={2}>
              {wishlist.description}
            </Text>
          )}

          <HStack gap={2} color={COLORS.text.secondary} fontSize="sm" mt={2}>
            <Avatar.Root 
              size="xs" 
              cursor="pointer"
              onClick={() => router.push(`/profile`)}
            >
              <Avatar.Fallback name={wishlist.owner} />
              <Avatar.Image src={profileImage || undefined} />
            </Avatar.Root>
            <Text fontWeight="semibold" color="white" cursor="pointer" onClick={() => router.push(`/profile`)} lineClamp={1}>
              {wishlist.owner}
            </Text>
            <Text display={{ base: 'none', md: 'block' }}>•</Text>
            <Text display={{ base: 'none', md: 'block' }}>
              {wishlist.item_count || 0} {wishlist.item_count === 1 ? 'item' : 'items'}
            </Text>
            {wishlist.due_date && (
              <>
                <Text display={{ base: 'none', md: 'block' }}>•</Text>
                <Text display={{ base: 'none', md: 'block' }}>{formatDueDate(wishlist.due_date)}</Text>
              </>
            )}
          </HStack>
        </VStack>
      </HStack>

      <WishlistMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        options={menuOptions}
      />

      <EditWishlistModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        wishlistId={wishlist.id}
        onSuccess={() => {
          // Refresh the wishlist data or trigger a refetch
          window.location.reload() // Replace with proper state management
        }}
      />

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        preSelectedWishlistId={wishlist.id}
        onSuccess={() => {
          onItemAdded?.()
          refetchItems?.()
        }}
      />

      <ItemSelectionManager
        selectedItems={selectedItems}
        onItemsDeleted={cancelSelection}
        refetchItems={refetchItems || (() => {})}
        confirmDeleteVisible={deleteConfirmVisible}
        setConfirmDeleteVisible={setDeleteConfirmVisible}
      />

      <ConfirmDialog
        isOpen={showDeleteWishlistConfirm}
        onClose={() => setShowDeleteWishlistConfirm(false)}
        title="Delete Wishlist"
        message={`Are you sure you want to delete "${wishlist.title}"? This will permanently delete the wishlist and all its items.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteWishlist}
        isDestructive
      />

      {/* Loading overlay */}
      {isDeletingWishlist && (
        <Box
          position="fixed"
          top={0} left={0} right={0} bottom={0}
          bg="rgba(0,0,0,0.6)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1001}
        >
          <Text color="white" fontSize="lg">Deleting wishlist...</Text>
        </Box>
      )}
      
    </Box>
  )
}