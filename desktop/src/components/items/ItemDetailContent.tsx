'use client'

import { Box, VStack, Heading, Text, Image, IconButton, HStack, Button, Stack } from '@chakra-ui/react'
import { LuArrowLeft, LuEllipsisVertical, LuCopy, LuExternalLink } from 'react-icons/lu'
import { COLORS } from '../../styles/common'
import { toaster } from '../ui/toaster'
import getLightColor from '../common/getLightColor'
import { ItemClaimingSection } from './ItemClaimingSection'
import { ItemMenu, type MenuOption } from './ItemMenu'
import type { WishlistItem } from '../../types/types'

export interface ItemDetailContentItem {
  id: string
  name: string
  description?: string | null
  price?: number | null
  url?: string | null
  image?: string | null
}

interface ItemDetailContentProps {
  item: ItemDetailContentItem
  wishlistColor: string
  /** Full URL for item image (API path or static demo URL) */
  imageSrc: string | null
  wishlistInfo?: { ownerName: string; name: string } | null
  isOwner: boolean
  isLoggedIn: boolean
  onBack: () => void
  readOnly?: boolean
  /** Allows read-only screens (demo) to keep URL link interactive */
  allowReadOnlyUrlOpen?: boolean
  /** Framed marketing / demo — tighter layout, no mutations */
  compact?: boolean
  /** Item menu (owner only, not readOnly) */
  isMenuOpen: boolean
  setIsMenuOpen: (open: boolean) => void
  menuOptions: MenuOption[]
  isNameExpanded: boolean
  setIsNameExpanded: (v: boolean) => void
  /** Claiming (forwarded from useItemClaiming when not readOnly) */
  claimProps?: {
    showGuestNameModal: boolean
    guestName: string
    setGuestName: (s: string) => void
    isClaimLoading: boolean
    isItemClaimed: boolean
    canUserUnclaim: boolean
    onClaimItem: () => void
    onUnclaimItem: () => void
    onGuestClaim: () => void
    onCancelGuestModal: () => void
  }
  onRegisterCta?: () => void
}

export function ItemDetailContent({
  item,
  wishlistColor,
  imageSrc,
  wishlistInfo,
  isOwner,
  isLoggedIn,
  onBack,
  readOnly = false,
  allowReadOnlyUrlOpen = false,
  compact = false,
  isMenuOpen,
  setIsMenuOpen,
  menuOptions,
  isNameExpanded,
  setIsNameExpanded,
  claimProps,
  onRegisterCta,
}: ItemDetailContentProps) {
  const backgroundColor = getLightColor(wishlistColor || COLORS.cardGray)
  const px = compact ? 4 : 8
  const py = compact ? 3 : 4
  const imgMaxW = compact ? { base: '14rem', md: '16rem' } : { base: '20rem', md: '22rem', lg: '30rem' }

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

  return (
    <Box
      h="100%"
      w="100%"
      overflowY={compact ? 'hidden' : 'auto'}
      overflowX="hidden"
      bg={COLORS.background}
      position="relative"
    >
      <Box bg={COLORS.background} px={px} py={py} position={compact ? 'relative' : 'sticky'} top={0} zIndex={10}>
        <HStack justify="space-between">
          <IconButton aria-label="Go back" variant="ghost" onClick={onBack} color="white" size={compact ? 'md' : 'lg'}>
            <LuArrowLeft />
          </IconButton>

          {!isOwner && wishlistInfo && (
            <VStack gap={0} flex="1" mx={compact ? 2 : 4}>
              <Text color={COLORS.text.secondary} fontSize={compact ? 'xs' : 'sm'}>
                {wishlistInfo.ownerName}
              </Text>
              <Text color="white" fontSize={compact ? 'sm' : 'md'} fontWeight="semibold">
                {wishlistInfo.name}
              </Text>
            </VStack>
          )}

          {isOwner && <Box flex="1" />}

          {isOwner && !readOnly ? (
            <IconButton aria-label="Menu" variant="ghost" onClick={() => setIsMenuOpen(true)} color="white" size={compact ? 'md' : 'lg'}>
              <LuEllipsisVertical />
            </IconButton>
          ) : (
            <Box w={compact ? '32px' : '40px'} />
          )}
        </HStack>
      </Box>

      <VStack align="stretch" px={px} pb={compact ? 4 : { base: 32, md: 32 }} gap={compact ? 4 : 6}>
        {imageSrc && (
          <Box
            w={imgMaxW}
            mx="auto"
            aspectRatio={1}
            bg={backgroundColor}
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="lg"
            overflow="hidden"
          >
            <Image src={imageSrc} alt={item.name} w="100%" h="100%" objectFit="contain" p={compact ? 2 : 4} />
          </Box>
        )}

        <VStack align="stretch" gap={compact ? 3 : 4} mx="auto" w="100%">
          <Stack direction={{ base: 'column', md: 'column' }} justify="space-between" align="start" gap={compact ? 2 : 4}>
            <Heading
              size={compact ? 'lg' : '2xl'}
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
              <Text color="white" fontSize={compact ? 'xl' : '2xl'} fontWeight="bold" flexShrink={0}>
                ${Number(item.price).toFixed(2)}
              </Text>
            )}
          </Stack>

          {item.url && !readOnly && (
            <Box bg={COLORS.cardGray} borderRadius="lg" p={compact ? 3 : 4} maxW={'50rem'}>
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

          {item.url && readOnly && (
            allowReadOnlyUrlOpen ? (
              <Box bg={COLORS.cardGray} borderRadius="lg" p={compact ? 3 : 4} maxW={'50rem'}>
                <Button
                  variant="ghost"
                  onClick={handleOpenUrl}
                  justifyContent="flex-start"
                  w="full"
                  color={COLORS.text.primary}
                  _hover={{ bg: COLORS.cardDarkLight }}
                  px={3}
                >
                  <HStack gap={2} w="100%">
                    <LuExternalLink />
                    <Text fontSize={compact ? 'xs' : 'sm'} lineBreak="anywhere" overflow="hidden">
                      {item.url}
                    </Text>
                  </HStack>
                </Button>
              </Box>
            ) : (
              <Text color={COLORS.text.secondary} fontSize={compact ? 'xs' : 'sm'} lineBreak="anywhere">
                {item.url}
              </Text>
            )
          )}

          {item.description && (
            <Text color={COLORS.text.secondary} fontSize={compact ? 'sm' : 'md'}>
              {item.description}
            </Text>
          )}
        </VStack>
      </VStack>

      {!readOnly && !isOwner && isLoggedIn && claimProps && (
        <Box
          position="fixed"
          bottom={{ base: 'calc(64px + 1rem)', md: '1rem' }}
          left={{ base: 0, md: 'calc(var(--sidebar-width) + 51px)' }}
          right={{ base: 0, md: '16px' }}
          px={4}
          zIndex={9}
          transition="all 0.2s"
        >
          <Box p={3} maxW="30rem" mx="auto">
            <ItemClaimingSection
              item={item as WishlistItem}
              wishlistColor={wishlistColor}
              isItemClaimed={claimProps.isItemClaimed}
              canUserUnclaim={claimProps.canUserUnclaim}
              isClaimLoading={claimProps.isClaimLoading}
              showGuestNameModal={claimProps.showGuestNameModal}
              guestName={claimProps.guestName}
              setGuestName={claimProps.setGuestName}
              onClaimItem={claimProps.onClaimItem}
              onUnclaimItem={claimProps.onUnclaimItem}
              onGuestClaim={claimProps.onGuestClaim}
              onCancelGuestModal={claimProps.onCancelGuestModal}
            />
          </Box>
        </Box>
      )}

      {!readOnly && !isOwner && !isLoggedIn && (
        <Box position="fixed" bottom="1rem" left={0} right={0} px={4} zIndex={9}>
          <Box p={3} maxW="30rem" mx="auto">
            <Button
              w="100%"
              bg="white"
              color="black"
              size="lg"
              onClick={onRegisterCta}
              _hover={{ bg: 'gray.200' }}
            >
              Create an account to claim this item
            </Button>
          </Box>
        </Box>
      )}

      {!readOnly && <ItemMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} options={menuOptions} />}
    </Box>
  )
}
