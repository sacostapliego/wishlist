import { Box, VStack, Input, Button, Text, IconButton, Heading } from '@chakra-ui/react'
import { LuX } from 'react-icons/lu'
import { useState } from 'react'
import { COLORS } from '../../styles/common'
import { toaster } from '../ui/toaster'
import userAPI from '../../services/user'
import { createPortal } from 'react-dom'

interface EditSizesModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  initialValues: {
    shoe_size?: string
    shirt_size?: string
    pants_size?: string
    hat_size?: string
    ring_size?: string
    dress_size?: string
    jacket_size?: string
  }
  onSuccess: () => void
}

export function EditSizesModal({ isOpen, onClose, userId, initialValues, onSuccess }: EditSizesModalProps) {
  const [shoeSize, setShoeSize] = useState(initialValues.shoe_size || '')
  const [shirtSize, setShirtSize] = useState(initialValues.shirt_size || '')
  const [pantsSize, setPantsSize] = useState(initialValues.pants_size || '')
  const [hatSize, setHatSize] = useState(initialValues.hat_size || '')
  const [ringSize, setRingSize] = useState(initialValues.ring_size || '')
  const [dressSize, setDressSize] = useState(initialValues.dress_size || '')
  const [jacketSize, setJacketSize] = useState(initialValues.jacket_size || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await userAPI.updateUserProfile(userId, {
        shoe_size: shoeSize.trim() || null || undefined,
        shirt_size: shirtSize.trim() || null || undefined,
        pants_size: pantsSize.trim() || null || undefined,
        hat_size: hatSize.trim() || null || undefined,
        ring_size: ringSize.trim() || null || undefined,
        dress_size: dressSize.trim() || null || undefined,
        jacket_size: jacketSize.trim() || null || undefined,
      })

      toaster.create({
        title: 'Success',
        description: 'Size preferences updated successfully!',
        type: 'success',
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating size preferences:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to update size preferences',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
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
        onClick={onClose}
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
          <Heading size="lg">Edit Size Preferences</Heading>
          <IconButton
            aria-label="Close"
            variant="ghost"
            onClick={onClose}
            size="sm"
          >
            <LuX />
          </IconButton>
        </Box>

        {/* Form */}
        <Box overflowY="auto" flex="1" px={6} py={4}>
          <VStack align="stretch" gap={4}>
            <Text color={COLORS.text.secondary} fontSize="sm">
              Update your size information to help friends and family find the perfect gifts for you.
            </Text>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
                Shoe Size
              </Text>
              <Input
                value={shoeSize}
                onChange={(e) => setShoeSize(e.target.value)}
                placeholder="e.g. 10 US"
                bg={COLORS.cardDarkLight}
                border="none"
                _placeholder={{ color: COLORS.text.muted }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
                Shirt Size
              </Text>
              <Input
                value={shirtSize}
                onChange={(e) => setShirtSize(e.target.value)}
                placeholder="e.g. L"
                bg={COLORS.cardDarkLight}
                border="none"
                _placeholder={{ color: COLORS.text.muted }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
                Pants Size
              </Text>
              <Input
                value={pantsSize}
                onChange={(e) => setPantsSize(e.target.value)}
                placeholder="e.g. 32x32"
                bg={COLORS.cardDarkLight}
                border="none"
                _placeholder={{ color: COLORS.text.muted }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
                Hat Size
              </Text>
              <Input
                value={hatSize}
                onChange={(e) => setHatSize(e.target.value)}
                placeholder="e.g. 7 1/4 / M"
                bg={COLORS.cardDarkLight}
                border="none"
                _placeholder={{ color: COLORS.text.muted }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
                Ring Size
              </Text>
              <Input
                value={ringSize}
                onChange={(e) => setRingSize(e.target.value)}
                placeholder="e.g. 9"
                bg={COLORS.cardDarkLight}
                border="none"
                _placeholder={{ color: COLORS.text.muted }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
                Dress Size
              </Text>
              <Input
                value={dressSize}
                onChange={(e) => setDressSize(e.target.value)}
                placeholder="e.g. 8"
                bg={COLORS.cardDarkLight}
                border="none"
                _placeholder={{ color: COLORS.text.muted }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
                Jacket Size
              </Text>
              <Input
                value={jacketSize}
                onChange={(e) => setJacketSize(e.target.value)}
                placeholder="e.g. M"
                bg={COLORS.cardDarkLight}
                border="none"
                _placeholder={{ color: COLORS.text.muted }}
              />
            </Box>

            <Button
              onClick={handleSave}
              colorScheme="blue"
              size="lg"
              mt={4}
              disabled={isLoading}
              loading={isLoading}
            >
              Save Preferences
            </Button>
          </VStack>
        </Box>
      </Box>
    </>,
    document.body
  )
}