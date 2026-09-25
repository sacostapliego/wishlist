'use client'

import { useState } from 'react'
import { Box, Button, Dialog, HStack, Input, Text, Textarea, VStack } from '@chakra-ui/react'
import { LuEyeOff, LuHandCoins, LuUsers } from 'react-icons/lu'
import { COLORS } from '../../styles/common'
import getLightColor from '../common/getLightColor'
import type { ItemContribution, WishlistItem } from '../../types/types'

/** Cents are noise on a $5,000 goal, so they only appear when they exist. */
function money(amount: number): string {
  const whole = Number.isInteger(amount)
  return amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })
}

function pledgedCount(count: number): string {
  return count === 1 ? '1 person has chipped in' : `${count} people have chipped in`
}

interface ContributionProgressProps {
  item: WishlistItem
  /** Bar colour, derived from the wishlist like everything else on this page. */
  accent: string
}

/**
 * The figures. Two shapes, decided by whether the item has a price:
 *
 *   price set  - a goal exists, so show a bar and "$1,200 of $5,000"
 *   price NULL - "help me pay for my car" has no target, so show the total alone
 *
 * A total above the goal is not an error. People are generous and the honor
 * system does not enforce arithmetic, so the bar caps at full and the numbers
 * stay truthful.
 */
function ContributionProgress({ item, accent }: ContributionProgressProps) {
  const total = item.contribution_total ?? 0
  const goal = item.price ?? null
  const hasGoal = goal !== null && goal > 0
  const percent = hasGoal ? Math.min(100, (total / goal) * 100) : 0

  return (
    <VStack align="stretch" gap={2}>
      <HStack justify="space-between" align="baseline" gap={3}>
        <Text color="white" fontSize="lg" fontWeight="bold">
          {money(total)}
          {hasGoal && (
            <Text as="span" color={COLORS.text.secondary} fontSize="sm" fontWeight="medium">
              {' '}
              of {money(goal)}
            </Text>
          )}
        </Text>
        {hasGoal && total >= goal && (
          <Text color={accent} fontSize="sm" fontWeight="semibold" flexShrink={0}>
            Fully funded
          </Text>
        )}
      </HStack>

      {hasGoal && (
        <Box bg="rgba(255,255,255,0.12)" borderRadius="full" h="8px" overflow="hidden">
          <Box
            bg={accent}
            h="100%"
            w={`${percent}%`}
            borderRadius="full"
            transition="width 0.3s ease"
          />
        </Box>
      )}

      {!hasGoal && (
        <Text color={COLORS.text.secondary} fontSize="xs">
          No target set — anything helps.
        </Text>
      )}
    </VStack>
  )
}

interface ItemContributionBarProps {
  item: WishlistItem
  wishlistColor?: string
  myContribution: ItemContribution | null
  isSubmitting: boolean
  showGuestNameModal: boolean
  guestName: string
  setGuestName: (name: string) => void
  onSubmitPledge: (amount: string, note: string) => void
  onConfirmGuestPledge: () => void
  onWithdrawPledge: () => void
  onCancelGuestModal: () => void
}

/**
 * The visitor's action, pinned to the bottom of the item page the way the claim
 * button is. Kept compact: the amount and note are collected in a dialog rather
 * than inline, because a form in a fixed bar covers half a phone screen.
 */
export function ItemContributionBar({
  item,
  wishlistColor,
  myContribution,
  isSubmitting,
  showGuestNameModal,
  guestName,
  setGuestName,
  onSubmitPledge,
  onConfirmGuestPledge,
  onWithdrawPledge,
  onCancelGuestModal,
}: ItemContributionBarProps) {
  const accent = getLightColor(wishlistColor || COLORS.cardGray)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  // Opening the form on an existing pledge pre-fills it, so "change my amount"
  // starts from what they actually pledged rather than from blank. Done in the
  // handler rather than an effect: the values are known at the moment of the
  // click, so there is nothing to synchronise after the fact.
  const openForm = () => {
    setAmount(myContribution ? String(myContribution.amount) : '')
    setNote(myContribution?.note ?? '')
    setIsFormOpen(true)
  }

  const submit = () => {
    onSubmitPledge(amount, note)
    setIsFormOpen(false)
  }

  return (
    <>
      <VStack align="stretch" gap={3} p={4} borderRadius="lg" bg={COLORS.cardGray}>
        <ContributionProgress item={item} accent={accent} />

        {myContribution ? (
          <HStack justify="space-between" gap={3}>
            <Text color="white" fontSize="sm" fontWeight="medium" lineClamp={1}>
              You&apos;re in for {money(myContribution.amount)}
            </Text>
            <HStack gap={1} flexShrink={0}>
              <Button
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                onClick={openForm}
                disabled={isSubmitting}
              >
                Change
              </Button>
              <Button
                size="sm"
                variant="ghost"
                color={COLORS.text.secondary}
                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                onClick={onWithdrawPledge}
                disabled={isSubmitting}
              >
                Withdraw
              </Button>
            </HStack>
          </HStack>
        ) : (
          <Button
            w="100%"
            bg={accent}
            color="white"
            _hover={{ opacity: 0.9 }}
            onClick={openForm}
            disabled={isSubmitting}
          >
            <HStack gap={2}>
              <LuHandCoins size={18} />
              <Text fontWeight="medium">Chip in</Text>
            </HStack>
          </Button>
        )}
      </VStack>

      {/* Amount and note */}
      <Dialog.Root open={isFormOpen} onOpenChange={(e) => !e.open && setIsFormOpen(false)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg={COLORS.cardDarkLight} mx={4}>
            <Dialog.Header>
              <Dialog.Title color="white">
                {myContribution ? 'Change your contribution' : 'Chip in'}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <Text color={COLORS.text.secondary} fontSize="sm">
                  How much are you putting toward {item.name}? Nothing is charged here —
                  this just tells everyone what you&apos;re covering.
                </Text>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
                    Amount *
                  </Text>
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="50"
                    inputMode="decimal"
                    autoFocus
                    bg={COLORS.background}
                    color={COLORS.text.primary}
                    borderColor={COLORS.cardGray}
                    _placeholder={{ color: COLORS.text.muted }}
                    _focus={{ borderColor: COLORS.primary }}
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
                    Note (optional)
                  </Text>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="From the Wilson family"
                    maxLength={280}
                    rows={2}
                    bg={COLORS.background}
                    color={COLORS.text.primary}
                    borderColor={COLORS.cardGray}
                    _placeholder={{ color: COLORS.text.muted }}
                    _focus={{ borderColor: COLORS.primary }}
                  />
                </Box>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={isSubmitting || !amount}
                bg={COLORS.primary}
                color="white"
                _hover={{ opacity: 0.9 }}
                ml={3}
              >
                {myContribution ? 'Save' : 'Contribute'}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Guests name themselves once per wishlist. The amount they already typed
          is held for them and replayed after this, so nothing is retyped. */}
      <Dialog.Root
        open={showGuestNameModal}
        onOpenChange={(e) => !e.open && onCancelGuestModal()}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg={COLORS.cardDarkLight} mx={4}>
            <Dialog.Header>
              <Dialog.Title color="white">Enter your name</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text color={COLORS.text.secondary} mb={4} fontSize="sm">
                So everyone else knows who&apos;s covering what. No account needed.
              </Text>
              <Input
                placeholder="Your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                autoFocus
                bg={COLORS.background}
                color={COLORS.text.primary}
                borderColor={COLORS.cardGray}
                _placeholder={{ color: COLORS.text.muted }}
                _focus={{ borderColor: COLORS.primary }}
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onCancelGuestModal}>
                Cancel
              </Button>
              <Button
                onClick={onConfirmGuestPledge}
                disabled={isSubmitting || !guestName.trim()}
                bg={COLORS.primary}
                color="white"
                _hover={{ opacity: 0.9 }}
                ml={3}
              >
                Contribute
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}

interface ItemContributionListProps {
  item: WishlistItem
  wishlistColor?: string
  contributions: ItemContribution[]
  isLoading: boolean
  isOwner: boolean
  /** Shown so a visitor can see the owner's own head start is counted. */
  ownerName?: string
}

/**
 * Who has chipped in, shown in the page body rather than the bottom bar because
 * it is information, not an action.
 *
 * For the owner of a blind list this is where the withheld figures are explained.
 * That state is driven by `contributions_hidden`, which is true whether or not
 * anyone has pledged — so saying "hidden" here reveals nothing. What must never
 * appear is a total of $0, which would read as "nobody has contributed".
 */
export function ItemContributionList({
  item,
  wishlistColor,
  contributions,
  isLoading,
  isOwner,
  ownerName,
}: ItemContributionListProps) {
  const accent = getLightColor(wishlistColor || COLORS.cardGray)
  const seed = item.owner_seed_amount ?? 0
  const count = item.contribution_count ?? 0

  if (item.contributions_hidden) {
    return (
      <Box bg={COLORS.cardGray} borderRadius="lg" p={4}>
        <HStack gap={3} align="start">
          <Box flexShrink={0} display="flex" pt="2px">
            <LuEyeOff size={18} color={COLORS.text.secondary} />
          </Box>
          <VStack align="start" gap={1} minW={0}>
            <Text color="white" fontSize="sm" fontWeight="semibold">
              Contributions are hidden from you
            </Text>
            <Text color={COLORS.text.secondary} fontSize="sm">
              This list keeps the surprise, so you can&apos;t see what people have put
              toward this item. Switch the list to open if you&apos;d rather see it —
              anything contributed before then stays hidden.
            </Text>
            {seed > 0 && (
              <Text color={COLORS.text.muted} fontSize="xs" pt={1}>
                Your own {money(seed)} is counted toward the goal.
              </Text>
            )}
          </VStack>
        </HStack>
      </Box>
    )
  }

  return (
    <Box bg={COLORS.cardGray} borderRadius="lg" p={4}>
      <VStack align="stretch" gap={3}>
        {/* The owner already sees the figures in the page body, since the bottom
            bar is a visitor's action and they do not get one. */}
        {isOwner && <ContributionProgress item={item} accent={accent} />}

        <HStack gap={2}>
          <Box flexShrink={0} display="flex">
            <LuUsers size={16} color={COLORS.text.secondary} />
          </Box>
          <Text color={COLORS.text.secondary} fontSize="sm">
            {count === 0 ? 'Nobody has chipped in yet' : pledgedCount(count)}
          </Text>
        </HStack>

        {seed > 0 && (
          <Text color={COLORS.text.muted} fontSize="xs">
            Includes {money(seed)} from {isOwner ? 'you' : ownerName || 'the owner'}.
          </Text>
        )}

        {isLoading && (
          <Text color={COLORS.text.muted} fontSize="sm">
            Loading contributions…
          </Text>
        )}

        {!isLoading && contributions.length > 0 && (
          <VStack align="stretch" gap={2}>
            {contributions.map((contribution) => (
              <HStack key={contribution.id} justify="space-between" gap={3} align="start">
                <VStack align="start" gap={0} minW={0} flex="1">
                  <Text color="white" fontSize="sm" fontWeight="medium" lineClamp={1}>
                    {contribution.contributor_display_name || 'Someone'}
                    {contribution.is_mine && (
                      <Text as="span" color={COLORS.text.muted} fontWeight="normal">
                        {' '}
                        (you)
                      </Text>
                    )}
                  </Text>
                  {contribution.note && (
                    <Text color={COLORS.text.secondary} fontSize="xs" lineClamp={2}>
                      {contribution.note}
                    </Text>
                  )}
                </VStack>
                <Text color="white" fontSize="sm" fontWeight="semibold" flexShrink={0}>
                  {money(contribution.amount)}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
