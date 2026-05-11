import {
  Box,
  VStack,
  HStack,
  Text,
  Grid,
  Image,
  Popover,
  Portal,
} from '@chakra-ui/react'
import { useRef, useState } from 'react'
import { LuUpload, LuX, LuPencil } from 'react-icons/lu'
import imageCompression from 'browser-image-compression'
import { COLORS } from '../../styles/common'
import { WISHLIST_ICON_MAP, getWishlistIcon } from '../../utils/wishlistIcons'
import { ThumbnailCropper } from './ThumbnailCropper'

const ICON_OPTIONS = Object.keys(WISHLIST_ICON_MAP)

interface ThumbnailPickerProps {
  thumbnailType: 'icon' | 'image'
  selectedIcon: string
  existingImageUrl?: string | null
  selectedImageFile?: File | null
  onThumbnailTypeChange: (type: 'icon' | 'image') => void
  onIconSelect: (iconKey: string) => void
  onImageSelect: (file: File | null) => void
}

export function ThumbnailPicker({
  thumbnailType,
  selectedIcon,
  existingImageUrl,
  selectedImageFile,
  onThumbnailTypeChange,
  onIconSelect,
  onImageSelect,
}: ThumbnailPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'image' | 'icon'>('image')
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  const imagePreviewUrl = selectedImageFile
    ? URL.createObjectURL(selectedImageFile)
    : existingImageUrl || null

  const SelectedIconComponent = getWishlistIcon(selectedIcon)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Compress before cropping — cap at 800px, max 1MB
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/png',
      })

      const reader = new FileReader()
      reader.onloadend = () => {
        setCropImageSrc(reader.result as string)
      }
      reader.readAsDataURL(compressed)
    } catch {
      // fallback: use original
      const reader = new FileReader()
      reader.onloadend = () => setCropImageSrc(reader.result as string)
      reader.readAsDataURL(file)
    }

    // Reset input so re-selecting same file works
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], 'thumbnail.png', { type: 'image/png' }) // png for transparency
    onImageSelect(croppedFile)
    onThumbnailTypeChange('image')
    setCropImageSrc(null)
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageSelect(null)
    onThumbnailTypeChange('icon')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // If cropper is open, show it inline instead of the popover content
  if (cropImageSrc) {
    return (
      <VStack align="stretch" gap={4}>
        <Box
          bg={COLORS.cardGray}
          borderRadius="xl"
          p={4}
          border="1px solid"
          borderColor={COLORS.border}
        >
          <Text fontSize="sm" fontWeight="medium" color="white" mb={3} textAlign="center">
            Crop your thumbnail
          </Text>
          <ThumbnailCropper  // ← new component, not ProfileImageCropper
            imageSrc={cropImageSrc}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropImageSrc(null)}
          />
        </Box>
      </VStack>
    )
  }

  const ThumbnailPreview = (
    <Box position="relative" w="120px" h="120px" mx="auto">
      <Box
        w="120px"
        h="120px"
        borderRadius="xl"
        bg={COLORS.cardGray}
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        cursor="pointer"
        position="relative"
        role="group"
        transition="all 0.2s"
        _hover={{ opacity: 0.85 }}
      >
        {thumbnailType === 'image' && imagePreviewUrl ? (
          <Image
            src={imagePreviewUrl}
            alt="Thumbnail"
            w="100%"
            h="100%"
            objectFit="cover"
          />
        ) : (
          <Box
            as={SelectedIconComponent}
            boxSize="48px"
            color={COLORS.text.muted}
          />
        )}

        {/* Edit overlay */}
        <Box
          position="absolute"
          inset={0}
          bg="rgba(0,0,0,0.4)"
          borderRadius="xl"
          display="flex"
          alignItems="center"
          justifyContent="center"
          opacity={0}
          transition="opacity 0.2s"
          _groupHover={{ opacity: 1 }}
          pointerEvents="none"
        >
          <Box as={LuPencil} boxSize="20px" color="white" />
        </Box>
      </Box>

      {/* Remove image button */}
      {thumbnailType === 'image' && imagePreviewUrl && (
        <Box
          as="button"
          position="absolute"
          top="-8px"
          right="-8px"
          bg={COLORS.cardDark ?? 'gray.700'}
          border="2px solid"
          borderColor={COLORS.border}
          borderRadius="full"
          w="24px"
          h="24px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          onClick={handleRemoveImage}
          _hover={{ bg: 'red.600', borderColor: 'red.600' }}
          transition="all 0.15s"
          zIndex={1}
        >
          <Box as={LuX} boxSize="12px" color="white" />
        </Box>
      )}
    </Box>
  )

  return (
    <VStack align="stretch" gap={4}>
      <Popover.Root positioning={{ placement: 'bottom' }}>
        <Popover.Trigger asChild>
          <Box display="flex" justifyContent="center">
            {ThumbnailPreview}
          </Box>
        </Popover.Trigger>

        <Portal>
          <Popover.Positioner>
            <Popover.Content
              bg={COLORS.cardGray}
              border="1px solid"
              borderColor={COLORS.border}
              borderRadius="xl"
              p={0}
              w="260px"
              overflow="hidden"
              boxShadow="lg"
            >
              {/* Tabs */}
              <HStack gap={0} borderBottom="1px solid" borderColor={COLORS.border}>
                {(['image', 'icon'] as const).map((tab) => (
                  <Box
                    key={tab}
                    flex={1}
                    py={2}
                    textAlign="center"
                    cursor="pointer"
                    fontSize="sm"
                    fontWeight="medium"
                    color={activeTab === tab ? 'white' : COLORS.text.muted}
                    borderBottom="2px solid"
                    borderColor={activeTab === tab ? COLORS.primary : 'transparent'}
                    transition="all 0.15s"
                    onClick={() => setActiveTab(tab)}
                    textTransform="capitalize"
                  >
                    {tab === 'image' ? 'Upload Image' : 'Choose Icon'}
                  </Box>
                ))}
              </HStack>

              <Box p={3}>
                {/* Image tab */}
                {activeTab === 'image' && (
                  <VStack gap={3}>
                    <Box
                      w="100%"
                      h="80px"
                      borderRadius="md"
                      border="2px dashed"
                      borderColor={COLORS.border}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      _hover={{ borderColor: COLORS.text.muted, bg: 'rgba(255,255,255,0.03)' }}
                      transition="all 0.15s"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Box as={LuUpload} boxSize="20px" color={COLORS.text.muted} mb={1} />
                      <Text fontSize="xs" color={COLORS.text.muted}>
                        {imagePreviewUrl ? 'Replace image' : 'Upload image'}
                      </Text>
                      <Text fontSize="xs" color={COLORS.text.muted} opacity={0.6} mt="1px">
                        Will be cropped to square
                      </Text>
                    </Box>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </VStack>
                )}

                {/* Icon tab */}
                {activeTab === 'icon' && (
                  <Grid templateColumns="repeat(5, 1fr)" gap={2}>
                    {ICON_OPTIONS.map((iconKey) => {
                      const IconComponent = getWishlistIcon(iconKey)
                      const isSelected = thumbnailType === 'icon' && selectedIcon === iconKey
                      return (
                        <Box
                          key={iconKey}
                          p={2}
                          borderRadius="md"
                          bg={isSelected ? COLORS.primary : 'transparent'}
                          cursor="pointer"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          transition="all 0.15s"
                          _hover={{ bg: isSelected ? COLORS.primary : COLORS.cardDarkLight }}
                          onClick={() => {
                            onIconSelect(iconKey)
                            onThumbnailTypeChange('icon')
                          }}
                        >
                          <Box
                            as={IconComponent}
                            boxSize="20px"
                            color={isSelected ? 'white' : COLORS.text.muted}
                          />
                        </Box>
                      )
                    })}
                  </Grid>
                )}
              </Box>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>

      <Text fontSize="xs" color={COLORS.text.muted} textAlign="center">
        Click to change thumbnail
      </Text>
    </VStack>
  )
}