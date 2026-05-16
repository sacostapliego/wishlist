'use client'

import { Box, Heading, Text, IconButton, HStack } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { LuArrowLeft, LuEllipsisVertical, LuCopy, LuExternalLink } from 'react-icons/lu'
import { COLORS } from '../styles/common'
import { API_URL } from '../services/api'
import { toaster } from '../components/ui/toaster'
import { ItemDetailContent } from '../components/items/ItemDetailContent'
import { useItemDetail } from '../hooks/useItemDetail'
import { useItemClaiming } from '../hooks/useItemClaiming'
import { ItemMenu, getItemMenuOptions } from '../components/items/ItemMenu'
import { EditItemModal } from '../components/items/EditItemModal'
import { useEffect, useState } from 'react'
import { wishlistAPI } from '../services/wishlist'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { useAuth } from '../context/AuthContext'

interface ItemPageProps {
  wishlistId: string
  itemId: string
}

function ItemPage({ wishlistId, itemId }: ItemPageProps) {
  const router = useRouter()
  const [isNameExpanded, setIsNameExpanded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { isLoggedIn } = useAuth()
  const isPublicView = !isLoggedIn

  const { item, wishlistColor, wishlistInfo, isLoading, error, isOwner, refetchItemData: refetchData } = useItemDetail(
    itemId,
    wishlistId,
    isPublicView
  )

  useEffect(() => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }
    metaThemeColor.setAttribute('content', '#141414')
  }, [])

  const {
    showGuestNameModal,
    guestName,
    setGuestName,
    isClaimLoading,
    isItemClaimed,
    canUserUnclaim,
    handleClaimItem,
    handleGuestClaim,
    handleUnclaimItem,
    cancelGuestModal,
  } = useItemClaiming(item, refetchData)

  const handleEditItem = () => {
    setIsEditModalOpen(true)
  }

  const handleShareItem = async () => {
    const shareUrl = `${window.location.origin}/wishlist/${wishlistId}/${itemId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toaster.create({
        title: 'Link Copied',
        description: 'Item link copied to clipboard!',
        type: 'success',
      })
    } catch (error) {
      console.error('Failed to copy link:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to copy link',
        type: 'error',
      })
    }
  }

  const handleDeleteItem = async () => {
    if (!itemId) return

    try {
      await wishlistAPI.deleteItem(itemId)
      toaster.create({
        title: 'Success',
        description: 'Item deleted successfully!',
        type: 'success',
      })
      router.push(`/wishlist/${wishlistId}`)
    } catch (error) {
      console.error('Failed to delete item:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to delete item',
        type: 'error',
      })
    }
  }

  const menuOptions = getItemMenuOptions({
    onEdit: handleEditItem,
    onShare: handleShareItem,
    onDelete: () => setIsDeleteDialogOpen(true),
  })

  if (isLoading) {
    return (
      <Box h="calc(100vh - 32px)" w="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">Loading...</Text>
      </Box>
    )
  }

  if (error || !item) {
    return (
      <Box h="calc(100vh - 32px)" w="100%" display="flex" flexDirection="column" bg={COLORS.background}>
        <Box bg={COLORS.background} px={8} py={4}>
          <HStack justify="space-between">
            <IconButton
              aria-label="Go back"
              variant="ghost"
              onClick={() => router.back()}
              color="white"
              size="lg"
            >
              <LuArrowLeft />
            </IconButton>
          </HStack>
        </Box>
        <Box flex="1" display="flex" alignItems="center" justifyContent="center">
          <Text color={COLORS.text.secondary}>
            {error || 'The requested item could not be found.'}
          </Text>
        </Box>
      </Box>
    )
  }

  const imageUrl = item.image ? `${API_URL}wishlist/${item.id}/image` : null

  return (
    <Box h={{ base: 'calc(100vh + 80px)', md: 'calc(100vh - 32px)' }} w="100%" position="relative">
      <ItemDetailContent
        item={item}
        wishlistColor={wishlistColor}
        imageSrc={imageUrl}
        wishlistInfo={wishlistInfo}
        isOwner={isOwner ?? false}
        isLoggedIn={isLoggedIn}
        onBack={() => router.back()}
        readOnly={false}
        compact={false}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        menuOptions={menuOptions}
        isNameExpanded={isNameExpanded}
        setIsNameExpanded={setIsNameExpanded}
        claimProps={{
          showGuestNameModal,
          guestName,
          setGuestName,
          isClaimLoading,
          isItemClaimed,
          canUserUnclaim,
          onClaimItem: handleClaimItem,
          onUnclaimItem: handleUnclaimItem,
          onGuestClaim: handleGuestClaim,
          onCancelGuestModal: cancelGuestModal,
        }}
        onRegisterCta={() => router.push('/auth/register')}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        itemId={itemId}
        onSuccess={refetchData}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteItem}
        isDestructive={true}
      />
      
    </Box>
  )
}

export default ItemPage
