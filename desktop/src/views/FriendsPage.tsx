'use client'

import { Box, VStack, HStack, Heading, Text, Button, IconButton, Avatar } from '@chakra-ui/react'
import { LuArrowLeft, LuUserPlus, LuChevronRight, LuCheck, LuX } from 'react-icons/lu'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { COLORS } from '../styles/common'
import { friendsAPI, type FriendInfo, type FriendRequestInfo } from '../services/friends'
import { toaster } from '../components/ui/toaster'
import { API_URL } from '../services/api'
import { AddFriendModal } from '../components/friends/AddFriendModal'
import { Tabs } from '@chakra-ui/react'

function FriendsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends')
  const [friends, setFriends] = useState<FriendInfo[]>([])
  const [requests, setRequests] = useState<FriendRequestInfo[]>([])
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [friendsList, friendRequests] = await Promise.all([
        friendsAPI.getFriendsList(),
        friendsAPI.getFriendRequests()
      ])
      setFriends(friendsList)
      setRequests(friendRequests)
    } catch (error) {
      console.error('Error loading friends data:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to load friends',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendsAPI.acceptFriendRequest(requestId)
      toaster.create({
        title: 'Success',
        description: 'Friend request accepted',
        type: 'success',
      })
      loadData()
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to accept friend request',
        type: 'error',
      })
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await friendsAPI.declineFriendRequest(requestId)
      toaster.create({
        title: 'Success',
        description: 'Friend request declined',
        type: 'success',
      })
      loadData()
    } catch (error) {
      console.error('Error declining friend request:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to decline friend request',
        type: 'error',
      })
    }
  }

  const handleAddFriendSuccess = () => {
    setIsAddFriendOpen(false)
    loadData()
  }

  if (loading) {
    return (
      <Box h={{base: "calc(100vh + 80px)", md:"calc(100vh - 32px)"}} w="100%" display="flex" alignItems="center" justifyContent="center">
        <Text color="white">Loading...</Text>
      </Box>
    )
  }

  return (
    <Box h={{base: "calc(100vh + 80px)", md:"calc(100vh - 32px)"}} w="100%" overflowY="auto" p={6}>
      <VStack align="stretch" gap={6} maxW="800px" mx="auto">
        {/* Header */}
        <HStack justify="space-between">
          <HStack gap={3}>
            <IconButton
              aria-label="Back"
              variant="ghost"
              onClick={() => router.back()}
            >
              <LuArrowLeft />
            </IconButton>
            <Heading size="xl" color="white">Friends</Heading>
          </HStack>
          <Button
            bg={COLORS.primary}
            color={COLORS.text.primary}
            size="sm"
            onClick={() => setIsAddFriendOpen(true)}
          >
            <HStack>
              <LuUserPlus />
              <Text>Add Friend</Text>
            </HStack>
          </Button>
        </HStack>

        {/* Tabs */}
        <Tabs.Root 
          value={activeTab} 
          onValueChange={(e) => setActiveTab(e.value as 'friends' | 'requests')}
          variant="enclosed"
        >
          <Tabs.List>
            <Tabs.Trigger value="friends">
              Friends ({friends.length})
            </Tabs.Trigger>
            <Tabs.Trigger value="requests">
              Requests ({requests.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="friends">
            <VStack align="stretch" gap={3} mt={4}>
              {friends.length === 0 ? (
                <Box
                  bg="#1a1a1a"
                  p={8}
                  borderRadius="lg"
                  textAlign="center"
                >
                  <VStack gap={3}>
                    <Text color={COLORS.text.secondary} fontSize="lg">
                      No friends yet
                    </Text>
                    <Text color={COLORS.text.muted} fontSize="sm">
                      Send a friend request to get started
                    </Text>
                    <Button
                      bg={COLORS.primary}
                      color={COLORS.text.primary}
                      size="sm"
                      mt={2}
                      onClick={() => setIsAddFriendOpen(true)}
                    >
                      <HStack>
                        <LuUserPlus />
                        <Text>Add Friend</Text>
                      </HStack>
                    </Button>
                  </VStack>
                </Box>
              ) : (
                friends.map((friend) => (
                  <Box
                    key={friend.id}
                    bg="#1a1a1a"
                    p={4}
                    borderRadius="lg"
                    cursor="pointer"
                    _hover={{ bg: '#252525' }}
                    transition="background 0.2s"
                    onClick={() => router.push(`/profile/${friend.id}`)}
                  >
                    <HStack justify="space-between">
                      <HStack gap={3}>
                        <Avatar.Root size="md">
                          <Avatar.Fallback name={friend.name || friend.username} />
                          <Avatar.Image 
                            src={`${API_URL}users/${friend.id}/profile-image`} 
                          />
                        </Avatar.Root>
                        <VStack align="start" gap={0}>
                          <Text color="white" fontWeight="semibold">
                            {friend.name || friend.username}
                          </Text>
                          <Text color={COLORS.text.secondary} fontSize="sm">
                            @{friend.username}
                          </Text>
                        </VStack>
                      </HStack>
                      <LuChevronRight color={COLORS.text.secondary} size={20} />
                    </HStack>
                  </Box>
                ))
              )}
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="requests">
            <VStack align="stretch" gap={3} mt={4}>
              {requests.length === 0 ? (
                <Box
                  bg="#1a1a1a"
                  p={8}
                  borderRadius="lg"
                  textAlign="center"
                >
                  <VStack gap={3}>
                    <Text color={COLORS.text.secondary} fontSize="lg">
                      No pending requests
                    </Text>
                    <Text color={COLORS.text.muted} fontSize="sm">
                      Friend requests sent to you will appear here
                    </Text>
                  </VStack>
                </Box>
              ) : (
                requests.map((request) => (
                  <Box
                    key={request.id}
                    bg="#1a1a1a"
                    p={4}
                    borderRadius="lg"
                  >
                    <HStack justify="space-between">
                      <HStack gap={3}>
                        <Avatar.Root size="md">
                          <Avatar.Fallback name={request.name || request.username} />
                          <Avatar.Image 
                            src={`${API_URL}users/${request.user_id}/profile-image`} 
                          />
                        </Avatar.Root>
                        <VStack align="start" gap={0}>
                          <Text color="white" fontWeight="semibold">
                            {request.name || request.username}
                          </Text>
                          <Text color={COLORS.text.secondary} fontSize="sm">
                            @{request.username}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack gap={2}>
                        <Button
                          size="sm"
                          bg={COLORS.primary}
                          color={COLORS.text.primary}
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <HStack gap={1}>
                            <LuCheck size={16} />
                            <Text>Accept</Text>
                          </HStack>
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDeclineRequest(request.id)}
                        >
                          <HStack gap={1}>
                            <LuX size={16} />
                            <Text>Decline</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </HStack>
                  </Box>
                ))
              )}
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </VStack>

      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        onSuccess={handleAddFriendSuccess}
      />
    </Box>
  )
}

export default FriendsPage