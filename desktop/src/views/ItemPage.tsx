'use client'

import { Box, VStack, Heading, Text, Image, IconButton, HStack, Button, Stack } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { LuArrowLeft, LuEllipsisVertical, LuCopy, LuExternalLink } from 'react-icons/lu'
import { COLORS } from '../styles/common'
import { API_URL } from '../services/api'
import { toaster } from '../components/ui/toaster'
import getLightColor from '../components/common/getLightColor'
import { useItemDetail } from '../hooks/useItemDetail'
import { useItemClaiming } from '../hooks/useItemClaiming'
import { ItemClaimingSection } from '../components/items/ItemClaimingSection'
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

  const handleCopyUrl = async () => {
    if (item?.url) {
      try {
        await navigator.clipboard.writeText(item.url)
        toaster.create({
          title: 'Copied',
          description: 'URL copied to clipboard!',
          type: 'success',
        })
      } catch (error) {
        console.error('Failed to copy URL:', error)
        toaster.create({
          title: 'Error',
          description: 'Failed to copy URL',
          type: 'error',
        })
      }
    }
  }

  const handleOpenUrl = () => {
    if (item?.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
    }
  }

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

  const backgroundColor = getLightColor(wishlistColor || COLORS.cardGray)
  const imageUrl = item.image ? `${API_URL}wishlist/${item.id}/image` : null

  return (
    <Box h={{base: "calc(100vh + 80px)", md:"calc(100vh - 32px)"}} w="100%" overflowY="auto" bg={COLORS.background} position="relative">
      {/* Header */}
      <Box bg={COLORS.background} px={8} py={4} position="sticky" top={0} zIndex={10}>
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

          {!isOwner && wishlistInfo && (
            <VStack gap={0} flex="1" mx={4}>
              <Text color={COLORS.text.secondary} fontSize="sm">
                {wishlistInfo.ownerName}
              </Text>
              <Text color="white" fontSize="md" fontWeight="semibold">
                {wishlistInfo.name}
              </Text>
            </VStack>
          )}

          {isOwner && (
            <Box flex="1" />
          )}

          {isOwner ? (
            <IconButton
              aria-label="Menu"
              variant="ghost"
              onClick={() => setIsMenuOpen(true)}
              color="white"
              size="lg"
            >
              <LuEllipsisVertical />
            </IconButton>
          ) : (
            <Box w="40px" />
          )}
        </HStack>
      </Box>

      {/* Content */}
      <VStack align="stretch" px={8} pb={{ base: 32, md: 32 }} gap={6}>
        {/* Image */}
        {imageUrl && (
          <Box
            w={{base: "20rem", md: "22rem", lg: "30rem"}}
            mx="auto"
            aspectRatio={1}
            bg={backgroundColor}
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="lg"
            overflow="hidden"
          >
            <Image
              src={imageUrl}
              alt={item.name}
              w="100%"
              h="100%"
              objectFit="contain"
              p={4}
            />
          </Box>
        )}

        {/* Item Details */}
        <VStack align="stretch" gap={4} mx="auto" w="100%">
          <Stack direction={{base:'column', md: 'column'}} justify="space-between" align="start" gap={4}>
            <Heading 
              size="2xl" 
              color="white" 
              flex="1"
              lineClamp={isNameExpanded ? undefined : 2}
              cursor="pointer"
              onClick={() => setIsNameExpanded(!isNameExpanded)}
              _hover={{ opacity: 0.8 }}
            >
              {item.name}
            </Heading>
            {item.price !== undefined && item.price !== null && (
              <Text color="white" fontSize="2xl" fontWeight="bold" flexShrink={0}>
                ${item.price.toFixed(2)}
              </Text>
            )}
          </Stack>

          {/* URL */}
          {item.url && (
            <Box
              bg={COLORS.cardGray}
              borderRadius="lg"
              p={4}
              maxW={"50rem"}
            >
              <HStack gap={3}>
                <Button
                  variant="ghost"
                  onClick={handleOpenUrl}
                  flex="1"
                  justifyContent="flex-start"
                  color={COLORS.text.primary}
                  _hover={{ bg: COLORS.cardDarkLight }}
                  px={3}
                >
                  <HStack gap={2} w="100%">
                    <LuExternalLink />
                    <Text fontSize="sm" lineBreak="anywhere" overflow={'hidden'}>
                      {item.url}
                    </Text>
                  </HStack>
                </Button>
                <IconButton
                  aria-label="Copy URL"
                  variant="ghost"
                  onClick={handleCopyUrl}
                  color={COLORS.text.primary}
                  _hover={{ bg: COLORS.cardDarkLight }}
                >
                  <LuCopy />
                </IconButton>
              </HStack>
            </Box>
          )}

          {/* Description */}
          {item.description && (
            <Text color={COLORS.text.secondary} fontSize="md">
              {item.description}
            </Text>
          )}
        </VStack>
      </VStack>

      {/* Sticky Claim Button - Only for non-owners */}
      {!isOwner && isLoggedIn && (
        <Box
          position="fixed"
          bottom={{ base: "calc(64px + 1rem)", md: "1rem" }}
          left={{ base: 0, md: "calc(var(--sidebar-width) + 51px)" }}
          right={{ base: 0, md: "16px" }}
          px={4}
          zIndex={9}
          transition="all 0.2s"
        >
          <Box p={3} maxW="30rem" mx="auto">
            <ItemClaimingSection
              item={item}
              wishlistColor={wishlistColor}
              isItemClaimed={isItemClaimed}
              canUserUnclaim={canUserUnclaim}
              isClaimLoading={isClaimLoading}
              showGuestNameModal={showGuestNameModal}
              guestName={guestName}
              setGuestName={setGuestName}
              onClaimItem={handleClaimItem}
              onUnclaimItem={handleUnclaimItem}
              onGuestClaim={handleGuestClaim}
              onCancelGuestModal={cancelGuestModal}
            />
          </Box>
        </Box>
      )}

      {!isOwner && !isLoggedIn && (
        <Box
          position="fixed"
          bottom="1rem"
          left={0}
          right={0}
          px={4}
          zIndex={9}
        >
          <Box p={3} maxW="30rem" mx="auto">
            <Button
              w="100%"
              bg="white"
              color="black"
              size="lg"
              onClick={() => router.push('/auth/register')}
              _hover={{ bg: 'gray.200' }}
            >
              Create an account to claim this item
            </Button>
          </Box>
        </Box>
      )}

      {/* Item Menu */}
      <ItemMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        options={menuOptions}
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
