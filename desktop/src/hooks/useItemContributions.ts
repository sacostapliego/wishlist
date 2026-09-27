import { useCallback, useEffect, useState } from 'react'
import { wishlistAPI } from '../services/wishlist'
import { guestSessionAPI, clearGuestSession, getGuestToken } from '../services/guestSession'
import { useAuth } from '../context/AuthContext'
import { toaster } from '../components/ui/toaster'
import type { ItemContribution, WishlistItem } from '../types/types'

interface ContributionItem {
  id: string
  wishlist_id?: string
  is_contribution?: boolean
  contributions_hidden?: boolean
}

/**
 * Pledging toward a contribution item, for members and guests alike.
 *
 * Shaped after useItemClaiming, with one difference that matters: a claim is a
 * single tap, but a pledge carries an amount. So when a guest has not named
 * themselves yet, the amount they typed has to survive the name prompt - it is
 * held in `pendingPledge` and replayed once the session exists. Losing it and
 * making them type it twice is the kind of small rudeness that stops people
 * bothering at all.
 *
 * No money moves. A pledge is a statement of intent on the honor system.
 */
export const useItemContributions = (
  item: ContributionItem | null,
  refetchItemData: () => Promise<void>
) => {
  const { user } = useAuth()
  const [contributions, setContributions] = useState<ItemContribution[]>([])
  const [isListLoading, setIsListLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGuestNameModal, setShowGuestNameModal] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [pendingPledge, setPendingPledge] = useState<{ amount: number; note: string } | null>(null)

  const itemId = item?.id
  const wishlistId = item?.wishlist_id
  const isContribution = Boolean(item?.is_contribution)
  // A blind owner always gets an empty list from the server, so there is nothing
  // to ask for.
  const canSeeContributions = isContribution && !item?.contributions_hidden

  const loadContributions = useCallback(async () => {
    if (!itemId || !canSeeContributions) {
      setContributions([])
      return
    }

    setIsListLoading(true)
    try {
      setContributions(await wishlistAPI.getContributions(itemId, wishlistId))
    } catch (error) {
      console.error('Error loading contributions:', error)
      setContributions([])
    } finally {
      setIsListLoading(false)
    }
  }, [itemId, wishlistId, canSeeContributions])

  useEffect(() => {
    loadContributions()
  }, [loadContributions])

  const myContribution = contributions.find((c) => c.is_mine) ?? null

  /**
   * Turns whatever the API said into something a person can act on. The backend
   * refuses a few states deliberately - already pledged, item claimed, owner
   * pledging to their own item - and each deserves better than "Request failed".
   */
  const describeFailure = (error: unknown, fallback: string): string => {
    const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
    return typeof detail === 'string' && detail ? detail : fallback
  }

  const applyUpdatedItem = async (updated: WishlistItem) => {
    // The write returned the item with fresh totals, but the page owns that
    // state, so refetch rather than trying to thread it back by hand.
    void updated
    await Promise.all([refetchItemData(), loadContributions()])
  }

  /** Pledge, or change an existing pledge - whichever applies. */
  const submitPledge = async (rawAmount: string, note: string) => {
    if (!itemId) return

    const amount = Number.parseFloat(rawAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toaster.create({
        title: 'Enter an amount',
        description: 'Contribute something more than $0.',
        type: 'error',
      })
      return
    }

    // Guests need a session before they can pledge. If they already have one on
    // this wishlist we reuse it, so they only ever type their name once.
    if (!user?.id && !getGuestToken(wishlistId)) {
      setPendingPledge({ amount, note })
      setShowGuestNameModal(true)
      return
    }

    setIsSubmitting(true)
    try {
      const updated = myContribution
        ? await wishlistAPI.updateMyContribution(itemId, amount, note, wishlistId)
        : await wishlistAPI.contributeToItem(itemId, amount, note, wishlistId)

      await applyUpdatedItem(updated)
      toaster.create({
        title: myContribution ? 'Contribution updated' : 'Thank you',
        description: myContribution
          ? 'Your contribution has been updated.'
          : 'Your contribution has been added.',
        type: 'success',
      })
    } catch (error) {
      console.error('Error contributing to item:', error)
      // A stale guest token is the likely cause of a 401, so drop it and let
      // them name themselves again.
      if (!user?.id && wishlistId) {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status === 401) clearGuestSession(wishlistId)
      }
      toaster.create({
        title: 'Could not contribute',
        description: describeFailure(error, 'Failed to add your contribution.'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /** Names the guest, then replays the pledge they already typed. */
  const confirmGuestPledge = async () => {
    if (!guestName.trim()) {
      toaster.create({
        title: 'Name needed',
        description: 'Please enter your name.',
        type: 'error',
      })
      return
    }

    if (!itemId || !wishlistId || !pendingPledge) {
      toaster.create({
        title: 'Error',
        description: 'Item not found.',
        type: 'error',
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Two steps on purpose: the session is what the token belongs to, and it
      // outlives this one pledge.
      await guestSessionAPI.start(wishlistId, guestName.trim())
      const updated = await wishlistAPI.contributeToItem(
        itemId,
        pendingPledge.amount,
        pendingPledge.note,
        wishlistId
      )

      setShowGuestNameModal(false)
      setGuestName('')
      setPendingPledge(null)
      await applyUpdatedItem(updated)
      toaster.create({
        title: 'Thank you',
        description: 'Your contribution has been added.',
        type: 'success',
      })
    } catch (error) {
      console.error('Error contributing as guest:', error)
      toaster.create({
        title: 'Could not contribute',
        description: describeFailure(error, 'Failed to add your contribution.'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const withdrawPledge = async () => {
    if (!itemId) return

    setIsSubmitting(true)
    try {
      const updated = await wishlistAPI.withdrawMyContribution(itemId, wishlistId)
      await applyUpdatedItem(updated)
      toaster.create({
        title: 'Contribution withdrawn',
        description: 'Your contribution has been removed.',
        type: 'success',
      })
    } catch (error) {
      console.error('Error withdrawing contribution:', error)
      toaster.create({
        title: 'Could not withdraw',
        description: describeFailure(error, 'Failed to remove your contribution.'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelGuestModal = () => {
    setShowGuestNameModal(false)
    setGuestName('')
    setPendingPledge(null)
  }

  return {
    // State
    contributions,
    myContribution,
    isListLoading,
    isSubmitting,
    showGuestNameModal,
    guestName,
    setGuestName,

    // Actions
    submitPledge,
    confirmGuestPledge,
    withdrawPledge,
    cancelGuestModal,
    reloadContributions: loadContributions,
  }
}
