import { useState } from 'react'
import { wishlistAPI } from '../services/wishlist'
import { useAuth } from '../context/AuthContext'
import { toaster } from '../components/ui/toaster'

interface WishlistItemDetails {
  id: string
  name: string
  price?: number
  description?: string
  url?: string
  image?: string
  claimed_by_user_id?: string
  claimed_by_name?: string
  claimed_by_display_name?: string
}

export const useItemClaiming = (
  item: WishlistItemDetails | null,
  refetchItemData: () => Promise<void>
) => {
  const { user } = useAuth()
  const [showGuestNameModal, setShowGuestNameModal] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [isClaimLoading, setIsClaimLoading] = useState(false)

  const handleClaimItem = async () => {
    if (!item) return

    // If user is not authenticated, show guest modal immediately
    if (!user?.id) {
      setShowGuestNameModal(true)
      return
    }

    setIsClaimLoading(true)
    try {
      await wishlistAPI.claimItem(item.id, { user_id: user.id })
      await refetchItemData()
      toaster.create({
        title: 'Success',
        description: 'You have claimed this item!',
        type: 'success',
      })
    } catch (error) {
      console.error('Error claiming item:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to claim item. It may already be claimed.',
        type: 'error',
      })
    } finally {
      setIsClaimLoading(false)
    }
  }

  const handleGuestClaim = async () => {
    if (!guestName.trim()) {
      toaster.create({
        title: 'Error',
        description: 'Please enter your name',
        type: 'error',
      })
      return
    }

    if (!item) {
      toaster.create({
        title: 'Error',
        description: 'Item not found',
        type: 'error',
      })
      return
    }

    setIsClaimLoading(true)
    try {
      await wishlistAPI.claimItem(item.id, { guest_name: guestName.trim() })
      setShowGuestNameModal(false)
      setGuestName('')
      toaster.create({
        title: 'Success',
        description: 'You have claimed this item!',
        type: 'success',
      })
      await refetchItemData()
    } catch (error) {
      console.error('Error claiming item:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to claim item. It may already be claimed.',
        type: 'error',
      })
    } finally {
      setIsClaimLoading(false)
    }
  }

  const handleUnclaimItem = async () => {
    if (!item) return

    setIsClaimLoading(true)
    try {
      const unclaimData = user?.id
        ? { user_id: user.id }
        : { guest_name: item.claimed_by_name || '' }

      await wishlistAPI.unclaimItem(item.id, unclaimData)
      toaster.create({
        title: 'Success',
        description: 'You have unclaimed this item.',
        type: 'success',
      })
      await refetchItemData()
    } catch (error) {
      console.error('Error unclaiming item:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to unclaim item.',
        type: 'error',
      })
    } finally {
      setIsClaimLoading(false)
    }
  }

  const cancelGuestModal = () => {
    setShowGuestNameModal(false)
    setGuestName('')
  }

  const isItemClaimed = Boolean(item?.claimed_by_user_id || item?.claimed_by_name)
  const canUserUnclaim = Boolean(
    user?.id
      ? item?.claimed_by_user_id === user.id
      : item?.claimed_by_name
  )

  return {
    // State
    showGuestNameModal,
    guestName,
    setGuestName,
    isClaimLoading,

    // Computed values
    isItemClaimed,
    canUserUnclaim,

    // Actions
    handleClaimItem,
    handleGuestClaim,
    handleUnclaimItem,
    cancelGuestModal,
  }
}