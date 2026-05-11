'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  Container,
  Image,
  IconButton,
  Spinner,
  Dialog,
} from '@chakra-ui/react'
import { LuCamera, LuX } from 'react-icons/lu'
import { useAuth } from '../context/AuthContext'
import { toaster } from '../components/ui/toaster'
import { COLORS } from '../styles/common'
import { ProfileImageCropper } from '../components/profile/ProfileImageCropper'
import imageCompression from 'browser-image-compression'
import type { ApiError } from '../types/types'

// Shared input styles
const inputStyles = {
  size: 'lg' as const,
  bg: '#1a1a1a',
  border: '2px solid',
  borderColor: COLORS.primary,
  color: 'white',
  _placeholder: { color: 'white' },
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null)
  const { register } = useAuth()
  const router = useRouter()

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/jpeg',
    }

    try {
      const compressedFile = await imageCompression(file, options)
      return compressedFile
    } catch (error) {
      console.error('Error compressing image:', error)
      return file
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingImage(true)
    try {
      const compressedFile = await compressImage(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string)
        setIsCropperOpen(true)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Error processing image:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to process image',
        type: 'error',
      })
    } finally {
      setIsProcessingImage(false)
    }
  }

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], 'profile-picture.jpg', {
      type: 'image/jpeg',
    })
    setProfilePicture(croppedFile)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result as string)
    }
    reader.readAsDataURL(croppedBlob)
    
    setIsCropperOpen(false)
    setTempImageSrc(null)
  }

  const handleCropCancel = () => {
    setIsCropperOpen(false)
    setTempImageSrc(null)
  }

  const removeProfilePicture = () => {
    setProfilePicture(null)
    setProfilePicturePreview(null)
  }

  const handleRegister = async () => {
    if (!email || !username || !password || !confirmPassword) {
      toaster.create({
        title: 'Error',
        description: 'Please fill in all required fields.',
        type: 'error',
      })
      return
    }

    if (/\s/.test(username)) {
      toaster.create({
        title: 'Error',
        description: 'Username cannot contain spaces.',
        type: 'error',
      })
      return
    }

    if (password !== confirmPassword) {
      toaster.create({
        title: 'Error',
        description: 'Passwords do not match.',
        type: 'error',
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toaster.create({
        title: 'Error',
        description: 'Enter a valid email address.',
        type: 'error',
      })
      return
    }

    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append('email', email)
      formData.append('username', username)
      formData.append('name', name || username)
      formData.append('password', password)

      if (profilePicture) {
        formData.append('profile_picture', profilePicture)
      }

      const response = await register(formData)
      if (response && response.user) {
        toaster.create({
          title: 'Success',
          description: 'Account created successfully!',
          type: 'success',
        })
        router.push('/')
      } else {
        toaster.create({
          title: 'Error',
          description: 'Registration failed. Try again.',
          type: 'error',
        })
      }
    } catch (e) {
      const error = e as ApiError
      let msg = 'Registration failed.'
      if (error?.response?.data?.detail) msg = error.response.data.detail as string
      else if (error?.message) msg = error.message
      toaster.create({
        title: 'Error',
        description: msg,
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Box minH="100vh" bg={COLORS.background} display="flex" alignItems="center" justifyContent="center" py={8}>
        <Container maxW="md">
          <VStack gap={6} bg="#141414" p={8} borderRadius="xl">
            <VStack gap={2} w="100%" alignItems="flex-start">
              <Heading size="2xl" color="white">
                Create your account!
              </Heading>
              <Text color={COLORS.text.secondary}>Sign up to get started</Text>
            </VStack>

            {/* Profile Picture Upload */}
            <VStack gap={2} w="100%">
              <Box position="relative">
                <Box
                  w="120px"
                  h="120px"
                  borderRadius="full"
                  overflow="hidden"
                  bg="#1a1a1a"
                  border="2px solid"
                  borderColor={COLORS.primary}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor={isProcessingImage ? 'not-allowed' : 'pointer'}
                  onClick={() => !isProcessingImage && document.getElementById('profile-picture-input')?.click()}
                >
                  {isProcessingImage ? (
                    <Spinner size="lg" color={COLORS.primary} />
                  ) : profilePicturePreview ? (
                    <Image
                      src={profilePicturePreview}
                      alt="Profile preview"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  ) : (
                    <LuCamera size={40} color={COLORS.text.secondary} />
                  )}
                </Box>
                {profilePicturePreview && !isProcessingImage && (
                  <IconButton
                    aria-label="Remove picture"
                    position="absolute"
                    top="-2"
                    right="-2"
                    size="sm"
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    onClick={removeProfilePicture}
                    _hover={{ bg: 'red.600' }}
                  >
                    <LuX />
                  </IconButton>
                )}
              </Box>
              <Text color={COLORS.text.secondary} fontSize="sm">
                Add profile picture (optional)
              </Text>
              <input
                id="profile-picture-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
                disabled={isProcessingImage}
              />
            </VStack>

            <VStack gap={4} w="100%">
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                {...inputStyles}
              />

              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                {...inputStyles}
              />

              <Input
                placeholder="First Name (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                {...inputStyles}
              />

              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                {...inputStyles}
              />

              <Input
                placeholder="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                {...inputStyles}
              />

              <Button
                w="100%"
                size="lg"
                background={COLORS.primary}
                color="white"
                onClick={handleRegister}
                loading={isLoading}
                disabled={isLoading}
              >
                Sign Up
              </Button>

              <Text color={COLORS.text.secondary} fontSize="sm" textAlign="center">
                Already have an account?{' '}
                <Text
                  as="span"
                  color={COLORS.primary}
                  fontWeight="semibold"
                  cursor="pointer"
                  onClick={() => router.push('/auth/login')}
                  _hover={{ textDecoration: 'underline' }}
                >
                  Sign In
                </Text>
              </Text>
            </VStack>
          </VStack>
        </Container>
      </Box>

      {/* Image Cropper Dialog */}
      <Dialog.Root open={isCropperOpen} onOpenChange={(e) => setIsCropperOpen(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="4xl" bg={COLORS.cardGray}>
            <Dialog.Header>
              <Dialog.Title color="white">Crop Profile Picture</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body>
              {tempImageSrc && (
                <ProfileImageCropper
                  imageSrc={tempImageSrc}
                  onCropComplete={handleCropComplete}
                  onCancel={handleCropCancel}
                />
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}