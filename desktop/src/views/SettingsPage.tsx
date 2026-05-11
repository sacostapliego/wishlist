'use client'

import { Box, VStack, Heading, Text, Button, HStack, IconButton, Image, Stack } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { LuArrowLeft, LuLogOut } from 'react-icons/lu'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { COLORS } from '../styles/common'
import { API_URL } from '../services/api'
import { EditProfilePictureModal } from '../components/modals/EditProfilePictureModal'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import userAPI from '../services/user'
import { toaster } from '../components/ui/toaster'

function SettingsPage() {
  const router = useRouter()
  const { user, logout, refreshUser } = useAuth()
  const [isEditPictureOpen, setIsEditPictureOpen] = useState(false)
  const [isRemovePictureOpen, setIsRemovePictureOpen] = useState(false)
  const [isRemovingPicture, setIsRemovingPicture] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleRemoveProfilePicture = async () => {
    setIsRemovingPicture(true)
    try {
      await userAPI.removeProfileImage(user!.id)  // pass user.id
      await refreshUser()
      toaster.create({
        title: 'Success',
        description: 'Profile picture removed successfully!',
        type: 'success',
      })
    } catch (error) {
      console.error('Error removing profile picture:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to remove profile picture',
        type: 'error',
      })
    } finally {
      setIsRemovingPicture(false)
    }
  }

  if (!user) {
    return null
  }

  const profileImage = `${API_URL}users/${user.id}/profile-image`
  const displayName = user.name || user.username

  return (
    <Box h="calc(100vh - 32px)" w="100%" overflowY="auto" bg={COLORS.background}>
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
          <Heading size="lg" color="white">
            Settings
          </Heading>
          <Box w="40px" />
        </HStack>
      </Box>

      {/* Settings Content */}
      <VStack gap={6} align="stretch" px={8} py={6}>

        {/* Profile Picture Section */}
        <Box>
          <Heading size="md" color="white" mb={4}>
            Profile Picture
          </Heading>

          <VStack
            gap={4}
            align="center"
            bg={COLORS.cardGray}
            borderRadius="xl"
            p={6}
          >
            {/* Current Profile Picture */}
            <Stack gap={4} align="center">
              <Box
                w="80px"
                h="80px"
                borderRadius="full"
                overflow="hidden"
                bg={COLORS.cardDarkLight}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                {user.pfp ? (
                  <Image
                    src={profileImage}
                    alt={displayName}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                ) : (
                  <Text color={COLORS.text.secondary} fontSize="3xl" fontWeight="bold">
                    {displayName?.charAt(0).toUpperCase() || '?'}
                  </Text>
                )}
              </Box>
            </Stack>

            {/* Update Picture Button */}
            <Button
              w="fit-content"
              bg={COLORS.primary}
              color="white"
              onClick={() => setIsEditPictureOpen(true)}
              _hover={{ opacity: 0.9 }}
              lineClamp={1}
            >
              Update Profile Picture
            </Button>

            {/* Remove Picture Button */}
            {user.pfp && (
              <Button
                w="fit-content"
                variant="outline"
                borderColor={COLORS.primary}
                color={COLORS.primary}
                onClick={() => setIsRemovePictureOpen(true)}
                loading={isRemovingPicture}
                _hover={{ bg: COLORS.primary, color: 'white' }}
                lineClamp={1}
              >
                Remove Profile Picture
              </Button>
            )}
          </VStack>
        </Box>

        {/* Account Information Section */}
        <Box>
          <Heading size="md" color="white" mb={4}>
            Account Information
          </Heading>
          
          <VStack
            gap={4}
            align="stretch"
            bg={COLORS.cardGray}
            borderRadius="xl"
            p={6}
          >
            {/* Name */}
            <Box>
              <Text color={COLORS.text.secondary} fontSize="sm" mb={1}>
                Name
              </Text>
              <Text color="white" fontSize="lg">
                {user.name || 'Not set'}
              </Text>
            </Box>

            {/* Username */}
            <Box>
              <Text color={COLORS.text.secondary} fontSize="sm" mb={1}>
                Username
              </Text>
              <Text color="white" fontSize="lg">
                @{user.username}
              </Text>
            </Box>

            {/* Email */}
            <Box>
              <Text color={COLORS.text.secondary} fontSize="sm" mb={1}>
                Email
              </Text>
              <Text color="white" fontSize="lg">
                {user.email}
              </Text>
            </Box>

            {/* Reset Password Button */}
            <Box pt={2}>
              <Button
                w="100%"
                variant="outline"
                colorScheme="blue"
                onClick={() => {
                  // TODO: Implement password reset
                  console.log('Reset password clicked')
                }}
              >
                Reset Password
              </Button>
            </Box>
          </VStack>
        </Box>

        {/* Logout Section */}
        <Box>
          <Box
            bg={COLORS.cardGray}
            borderRadius="xl"
            p={4}
            cursor="pointer"
            onClick={handleLogout}
            _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
            transition="background 0.2s"
          >
            <HStack gap={3}>
              <LuLogOut size={24} color="#ef4444" />
              <Text color="#ef4444" fontSize="lg" fontWeight="medium">
                Logout
              </Text>
            </HStack>
          </Box>
        </Box>
      </VStack>

      {/* Edit Profile Picture Modal */}
      <EditProfilePictureModal
        isOpen={isEditPictureOpen}
        onClose={() => setIsEditPictureOpen(false)}
        userId={user.id}
        currentImage={user.pfp}
        onSuccess={async () => {
          await refreshUser()
        }}
      />

      {/* Remove Profile Picture Confirm Dialog */}
      <ConfirmDialog
        isOpen={isRemovePictureOpen}
        onClose={() => setIsRemovePictureOpen(false)}
        title="Remove Profile Picture"
        message="Are you sure you want to remove your profile picture? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleRemoveProfilePicture}
        isDestructive
      />
    </Box>
  )
}

export default SettingsPage