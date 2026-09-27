import { useState } from 'react'
import { wishlistAPI } from '../services/wishlist'
import { guestSessionAPI, clearGuestSession, getGuestToken } from '../services/guestSession'
import { useAuth } from '../context/AuthContext'
import { toaster } from '../components/ui/toaster'

interface WishlistItemDetails {
  id: string
  name: string
  price?: number
  description?: string
  url?: string
  image?: string
  wishlist_id?: string
  is_claimed?: boolean | null
  /** Server-computed: true when the requester is the one who claimed it. */
  claimed_by_viewer?: boolean
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

    // Guests need a session before they can claim. If they already have one on
    // this wishlist we reuse it, so they only ever type their name once.
    if (!user?.id && !getGuestToken(item.wishlist_id)) {
      setShowGuestNameModal(true)
      return
    }

    setIsClaimLoading(true)
    try {
      await wishlistAPI.claimItem(item.id, item.wishlist_id)
      await refetchItemData()
      toaster.create({
        title: 'Success',
        description: 'You have claimed this item!',
        type: 'success',
      })
    } catch (error) {
      console.error('Error claiming item:', error)
      // A stale guest token is the likely cause of a 401 here, so drop it and
      // let them name themselves again.
      if (!user?.id && item.wishlist_id) {
        clearGuestSession(item.wishlist_id)
      }
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

    if (!item?.wishlist_id) {
      toaster.create({
        title: 'Error',
        description: 'Item not found',
        type: 'error',
      })
      return
    }

    setIsClaimLoading(true)
    try {
      // Two steps on purpose: the session is what the token belongs to, and it
      // outlives this one claim.
      await guestSessionAPI.start(item.wishlist_id, guestName.trim())
      await wishlistAPI.claimItem(item.id, item.wishlist_id)

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
      await wishlistAPI.unclaimItem(item.id, item.wishlist_id)
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

  // Both flags come from the server. The client no longer infers who claimed
  // what from the display name, which every visitor can see.
  const isItemClaimed = Boolean(item?.is_claimed)
  const canUserUnclaim = Boolean(item?.claimed_by_viewer)

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
