import { Box, VStack, HStack, Input, Button, Text, Avatar, Heading, IconButton } from '@chakra-ui/react'
import { LuSearch, LuX } from 'react-icons/lu'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { friendsAPI, type UserSearchResponse } from '../../services/friends'
import { COLORS } from '../../styles/common'
import { API_URL } from '../../services/api'
import { toaster } from '../ui/toaster'

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddFriendModal({ isOpen, onClose, onSuccess }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<UserSearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAddingFriend, setIsAddingFriend] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await friendsAPI.searchUsers(searchQuery.trim())
      setSearchResult(Array.isArray(results) && results.length > 0 ? results[0] : null)
      
      if (!results || (Array.isArray(results) && results.length === 0)) {
        toaster.create({
          title: 'Not found',
          description: 'User not found',
          type: 'info',
        })
      }
    } catch (error) {
      console.error('Search error:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to search for user',
        type: 'error',
      })
      setSearchResult(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFriend = async () => {
    if (!searchResult?.id) return

    setIsAddingFriend(true)
    try {
      await friendsAPI.sendFriendRequest(searchResult.id)
      toaster.create({
        title: 'Success',
        description: 'Friend request sent!',
        type: 'success',
      })
      setSearchResult(null)
      setSearchQuery('')
      onSuccess()
    } catch (error) {
      console.error('Add friend error:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to send friend request',
        type: 'error',
      })
    } finally {
      setIsAddingFriend(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSearchResult(null)
    onClose()
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
        onClick={handleClose}
      />

      {/* Modal */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        bg={COLORS.cardDarkLight}
        borderRadius="lg"
        zIndex={1000}
        maxW={{ base: '100%', md: '500px' }}
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
          <Heading color={COLORS.text.primary} size="lg">Add Friend</Heading>
          <IconButton
            aria-label="Close"
            variant="ghost"
            onClick={handleClose}
            size="sm"
          >
            <LuX />
          </IconButton>
        </Box>

        {/* Body */}
        <Box px={6} pb={6}>
          <VStack align="stretch" gap={4}>
            <HStack>
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                bg={COLORS.primary}
                color={COLORS.text.primary}
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                <LuSearch />
              </Button>
            </HStack>

            {searchResult && (
              <Box
                bg="#1a1a1a"
                p={4}
                borderRadius="lg"
              >
                <HStack justify="space-between">
                  <HStack gap={3}>
                    <Avatar.Root size="md">
                      <Avatar.Fallback name={searchResult.name || searchResult.username} />
                      <Avatar.Image 
                        src={`${API_URL}users/${searchResult.id}/profile-image`} 
                      />
                    </Avatar.Root>
                    <VStack align="start" gap={0}>
                      <Text color="white" fontWeight="semibold">
                        {searchResult.name || searchResult.username}
                      </Text>
                      <Text color={COLORS.text.secondary} fontSize="sm">
                        @{searchResult.username}
                      </Text>
                    </VStack>
                  </HStack>
                  <Button
                    bg={COLORS.primary}
                    color={COLORS.text.primary}
                    size="sm"
                    onClick={handleAddFriend}
                    disabled={isAddingFriend}
                  >
                    {isAddingFriend ? 'Sending...' : 'Add Friend'}
                  </Button>
                </HStack>
              </Box>
            )}
          </VStack>
        </Box>
      </Box>
    </>,
    document.body
  )
}