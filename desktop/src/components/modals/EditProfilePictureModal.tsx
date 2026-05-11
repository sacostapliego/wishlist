import { Box, VStack, Button, IconButton, Heading, Text } from '@chakra-ui/react'
import { LuX, LuUpload, LuTrash2 } from 'react-icons/lu'
import { useState, useRef } from 'react'
import { COLORS } from '../../styles/common'
import { toaster } from '../ui/toaster'
import userAPI from '../../services/user'
import { ProfileImageCropper } from '../profile/ProfileImageCropper'
import imageCompression from 'browser-image-compression'
import { createPortal } from 'react-dom'

interface EditProfilePictureModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  currentImage?: string
  onSuccess: () => void
}

export function EditProfilePictureModal({
  isOpen,
  onClose,
  userId,
  currentImage,
  onSuccess,
}: EditProfilePictureModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Compress image before cropping
      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }

      const compressedFile = await imageCompression(file, options)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Error processing image:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to process image',
        type: 'error',
      })
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsLoading(true)
    try {
      const file = new File([croppedBlob], 'profile-picture.jpg', { type: 'image/jpeg' })
      
      await userAPI.updateProfileImage(userId, file)

      toaster.create({
        title: 'Success',
        description: 'Profile picture updated successfully!',
        type: 'success',
      })

      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error updating profile picture:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to update profile picture',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveProfilePicture = async () => {
    setIsLoading(true)
    try {
      await userAPI.removeProfileImage(userId)

      toaster.create({
        title: 'Success',
        description: 'Profile picture removed successfully!',
        type: 'success',
      })

      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error removing profile picture:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to remove profile picture',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedImage(null)
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
        bg={COLORS.cardGray}
        borderRadius="lg"
        zIndex={1000}
        w="90vw"
        maxW="600px"
        maxH="90vh"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Box
          px={6}
          py={4}
          borderBottom={`1px solid ${COLORS.cardDarkLight}`}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Heading size="lg">Edit Profile Picture</Heading>
          <IconButton
            aria-label="Close"
            variant="ghost"
            onClick={handleClose}
            size="sm"
          >
            <LuX />
          </IconButton>
        </Box>

        {/* Content */}
        <Box overflowY="auto" flex="1" px={6} py={4}>
          {selectedImage ? (
            <ProfileImageCropper
              imageSrc={selectedImage}
              onCropComplete={handleCropComplete}
              onCancel={() => setSelectedImage(null)}
            />
          ) : (
            <VStack align="stretch" gap={4}>
              <Text color={COLORS.text.secondary} fontSize="sm">
                Upload a new profile picture. You'll be able to crop it to a square.
              </Text>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                bg={COLORS.primary}
                color="white"
                size="lg"
                disabled={isLoading}
              >
                <LuUpload />
                Upload New Picture
              </Button>

              {currentImage && (
                <>
                  <Box position="relative">
                    <Box position="absolute" top="50%" left={0} right={0} h="1px" bg={COLORS.cardDarkLight} />
                    <Text
                      textAlign="center"
                      bg={COLORS.cardGray}
                      position="relative"
                      mx="auto"
                      px={3}
                      w="fit-content"
                      color={COLORS.text.secondary}
                      fontSize="sm"
                    >
                      or
                    </Text>
                  </Box>

                  <Button
                    onClick={handleRemoveProfilePicture}
                    variant="outline"
                    borderColor="red.500"
                    color="red.500"
                    size="lg"
                    disabled={isLoading}
                    _hover={{ bg: 'red.500', color: 'white' }}
                  >
                    <LuTrash2 />
                    Remove Current Picture
                  </Button>
                </>
              )}
            </VStack>
          )}
        </Box>
      </Box>
    </>,
    document.body
  )
}