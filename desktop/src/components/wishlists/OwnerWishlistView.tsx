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
    demo_thumbnail_url?: string | null
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
  /** Marketing / embedded demo: no create, menu, or destructive flows */
  demoMode?: boolean
  onDemoBack?: () => void
  /** Smaller hero for narrow frames */
  compactHeader?: boolean
}

export function OwnerWishlistView({
  wishlist,
  onItemAdded,
  refetchItems,
  isSelectionMode,
  setIsSelectionMode,
  selectedItems,
  setSelectedItems,
  demoMode = false,
  onDemoBack,
  compactHeader = false,
}: OwnerWishlistViewProps) {
  const router = useRouter()
  const handleBack = () => (onDemoBack ? onDemoBack() : router.back())
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isDeletingWishlist, setIsDeletingWishlist] = useState(false)
  const [showDeleteWishlistConfirm, setShowDeleteWishlistConfirm] = useState(false)
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false)
  const profileImage =
    demoMode || !wishlist.owner_id ? null : `${API_URL}users/${wishlist.owner_id}/profile-image`

  const thumbBox = compactHeader
    ? ({ base: '4rem', md: '5.5rem', lg: '6rem', '2xl': '7rem' } as Record<string, string>)
    : { base: '9rem', md: '13rem', lg: '15rem', '2xl': '17rem' }
  const thumbIcon = compactHeader
    ? ({ base: '2.25rem', md: '2.75rem', lg: '3rem', '2xl': '3.25rem' } as Record<string, string>)
    : { base: '5rem', md: '6rem', lg: '8rem', '2xl': '10rem' }
  const titleSize = compactHeader
    ? ({ base: 'lg' as const, md: 'xl' as const, lg: '2xl' as const })
    : ({ base: 'xl' as const, md: '3xl' as const, lg: '4xl' as const })

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
    <Box bg={wishlist.color || COLORS.cardGray} px={compactHeader ? 3 : { base: 4, md: 6 }} py={compactHeader ? 3 : 6}>
      {/* Header with back button and menu */}
      <HStack justify="space-between" mb={compactHeader ? 2 : 4}>
        <IconButton
          aria-label="Go back"
          variant="ghost"
          onClick={handleBack}
          color="white"
          size={compactHeader ? 'md' : 'lg'}
        >
          <LuArrowLeft />
        </IconButton>

        <HStack gap={2}>
          {!demoMode && !isSelectionMode && (
            <>
              <IconButton
                aria-label="Add item"
                variant="ghost"
                onClick={() => setIsAddItemModalOpen(true)}
                color="white"
                size={compactHeader ? 'md' : 'lg'}
              >
                <LuPlus />
              </IconButton>

              <IconButton
                aria-label="Menu"
                variant="ghost"
                onClick={() => setIsMenuOpen(true)}
                color="white"
                size={compactHeader ? 'md' : 'lg'}
              >
                <LuEllipsisVertical />
              </IconButton>
            </>
          )}

          {!demoMode && isSelectionMode && (
            <>
              <Button variant="ghost" onClick={cancelSelection} color="white">
                Cancel
              </Button>
              <Button
                bg={COLORS.error}
                color="white"
                onClick={() => setDeleteConfirmVisible(true)}
                disabled={selectedItems.length === 0}
                _hover={{
                  opacity: 0.9,
                }}
              >
                Delete ({selectedItems.length})
              </Button>
            </>
          )}
        </HStack>
      </HStack>

      <HStack align="flex-end" gap={compactHeader ? 4 : 6}>
        {/* Wishlist Icon */}
        <WishlistThumbnail
          wishlist={wishlist}
          boxSize={thumbBox}
          iconSize={thumbIcon}
          sx={{ boxShadow: '0 4px 60px rgba(0,0,0,0.5)' }}
          showBackground={false}
        />

        {/* Wishlist Info */}
        <VStack align="start" gap={compactHeader ? 1 : 2} pb={compactHeader ? 2 : 4}>
          <Heading size={titleSize} color="white" lineHeight="1.2" wordBreak="break-word">
            {wishlist.title}
          </Heading>

          {wishlist.description && (
            <Text color={COLORS.text.secondary} fontSize={compactHeader ? 'xs' : 'sm'} mt={compactHeader ? 0 : 2} lineClamp={compactHeader ? 2 : undefined}>
              {wishlist.description}
            </Text>
          )}

          <HStack gap={2} color={COLORS.text.secondary} fontSize={compactHeader ? 'xs' : 'sm'} mt={compactHeader ? 0 : 2}>
            {!demoMode && (
              <Avatar.Root
                size="xs"
                cursor="pointer"
                onClick={() => router.push(`/profile`)}
              >
                <Avatar.Fallback name={wishlist.owner} />
                <Avatar.Image src={profileImage || undefined} />
              </Avatar.Root>
            )}
            <Text
              fontWeight="semibold"
              color="white"
              cursor="pointer"
              onClick={() => (demoMode ? router.push('/auth/login') : router.push(`/profile`))}
              lineClamp={1}
            >
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

      {!demoMode && (
        <>
          <WishlistMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} options={menuOptions} />

          <EditWishlistModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            wishlistId={wishlist.id}
            onSuccess={() => {
              window.location.reload()
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
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(0,0,0,0.6)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              zIndex={1001}
            >
              <Text color="white" fontSize="lg">
                Deleting wishlist...
              </Text>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}