import { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react'
import {
  VStack,
  Input,
  Textarea,
  Button,
  Text,
  Box,
  Image,
  HStack,
  Spinner,
  Slider,
  NativeSelect,
} from '@chakra-ui/react'
import { LuImage, LuScissors, LuPlus, LuCheck } from 'react-icons/lu'
import { COLORS } from '../../styles/common'
import { toaster } from '../ui/toaster'
import { wishlistAPI } from '../../services/wishlist'
import imageCompression from 'browser-image-compression'
import type { Wishlist } from '../../types/types'

export interface ItemFormData {
  name: string
  description?: string
  price?: string
  url?: string
  currentImageUri?: string
  newImageUri?: string
  priority?: number
  wishlistId?: string
}

interface ItemFormProps {
  initialValues?: Partial<ItemFormData>
  onSubmit: (data: ItemFormData, imageFile?: File | string) => void
  isLoading?: boolean
  submitLabel?: string
  wishlists?: Wishlist[]
  selectedWishlistId?: string
  onWishlistChange?: (wishlistId: string) => void
  loadingWishlists?: boolean
  isEditMode?: boolean
  hideWishlistSelector?: boolean
}

export interface ItemFormRef {
  submitForm: () => void
  resetForm: () => void
}

export const ItemForm = forwardRef<ItemFormRef, ItemFormProps>(
  (
    {
      initialValues = {},
      onSubmit,
      isLoading = false,
      submitLabel = 'Submit',
      wishlists = [],
      selectedWishlistId,
      onWishlistChange,
      loadingWishlists = false,
      isEditMode = false,
      hideWishlistSelector = false,
    },
    ref
  ) => {
    const [name, setName] = useState(initialValues.name || '')
    const [description, setDescription] = useState(initialValues.description || '')
    const [price, setPrice] = useState(initialValues.price || '')
    const [url, setUrl] = useState(initialValues.url || '')
    const [image, setImage] = useState<string | undefined>(
      initialValues.currentImageUri || initialValues.newImageUri || undefined
    )
    const [priority, setPriority] = useState(initialValues.priority || 0)
    const [isProcessingImage, setIsProcessingImage] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      setName(initialValues.name || '')
      setDescription(initialValues.description || '')
      setPrice(initialValues.price || '')
      setUrl(initialValues.url || '')
      setImage(initialValues.currentImageUri || initialValues.newImageUri || undefined)
      setPriority(initialValues.priority || 0)
    }, [initialValues])

    useImperativeHandle(ref, () => ({
      submitForm: handleSubmit,
      resetForm,
    }))

    const resetForm = () => {
      setName(initialValues.name || '')
      setDescription(initialValues.description || '')
      setPrice(initialValues.price || '')
      setUrl(initialValues.url || '')
      setImage(initialValues.currentImageUri || undefined)
      setPriority(initialValues.priority || 0)
    }

    const compressImage = async (file: File): Promise<File> => {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/png',
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
          setImage(reader.result as string)
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

    const handleRemoveBackground = async () => {
      if (!image) return

      setIsProcessingImage(true)
      try {
        const response = await fetch(image)
        const blob = await response.blob()
        const fileName = image.split('/').pop() || 'image.jpg'
        const fileType = blob.type || 'image/jpeg'
        const imageFile = new File([blob], fileName, { type: fileType })

        const result = await wishlistAPI.processImageForBackgroundRemoval(imageFile)

        if (result && result.image_data_url) {
          setImage(result.image_data_url)
          toaster.create({
            title: 'Success',
            description: 'Background removed successfully!',
            type: 'success',
          })
        } else {
          throw new Error('Invalid response from server.')
        }
      } catch (error) {
        console.error('Failed to remove background:', error)
        toaster.create({
          title: 'Error',
          description: 'Could not remove background. Please try again.',
          type: 'error',
        })
      } finally {
        setIsProcessingImage(false)
      }
    }

    const handleSubmit = async () => {
      if (!name.trim()) {
        toaster.create({
          title: 'Validation Error',
          description: 'Item name is required.',
          type: 'error',
        })
        return
      }
      if (!isEditMode && !hideWishlistSelector && !selectedWishlistId) {
        toaster.create({
          title: 'Validation Error',
          description: 'Please select a wishlist.',
          type: 'error',
        })
        return
      }

      let imageFile: File | string | undefined = undefined

      if (image && image !== initialValues.currentImageUri) {
        try {
          const response = await fetch(image)
          const blob = await response.blob()
          const mimeType = blob.type || 'image/png'
          const fileExtension = mimeType.split('/')[1] || 'png'
          imageFile = new File([blob], `item-image.${fileExtension}`, { type: mimeType })
        } catch (imgError) {
          console.error('Error processing image for upload:', imgError)
          toaster.create({
            title: 'Image Error',
            description: 'Could not process the selected image.',
            type: 'error',
          })
          return
        }
      }

      onSubmit(
        { name, description, price, url, newImageUri: image, priority, wishlistId: selectedWishlistId },
        imageFile
      )
    }

    return (
      <VStack align="stretch" gap={4}>
        {/* Wishlist Selector */}
        {!isEditMode && !hideWishlistSelector && onWishlistChange && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
              Select Wishlist *
            </Text>
            {loadingWishlists ? (
              <Box display="flex" justifyContent="center" py={4}>
                <Spinner size="sm" color={COLORS.primary} />
              </Box>
            ) : wishlists.length > 0 ? (
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={selectedWishlistId}
                  onChange={(e) => onWishlistChange(e.target.value)}
                  bg={COLORS.cardDarkLight}
                  color={COLORS.text.primary}
                  borderColor={COLORS.cardDarkLight}
                  _focus={{ borderColor: COLORS.primary }}
                >
                  {wishlists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.title}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            ) : (
              <Text color={COLORS.text.secondary} fontSize="sm">
                You don't have any wishlists yet. Create one first!
              </Text>
            )}
          </Box>
        )}

        {/* Item Name */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
            Item Name *
          </Text>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter item name"
            bg={COLORS.cardDarkLight}
            color={COLORS.text.primary}
            borderColor={COLORS.cardDarkLight}
            _placeholder={{ color: COLORS.text.muted }}
            _focus={{ borderColor: COLORS.primary }}
          />
        </Box>

        {/* Image Upload */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
            Image
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <Box
            cursor="pointer"
            onClick={() => fileInputRef.current?.click()}
            bg={COLORS.cardDarkLight}
            borderRadius="lg"
            overflow="hidden"
            aspectRatio={1}
            maxW="300px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
          >
            {isProcessingImage ? (
              <Spinner size="lg" color={COLORS.primary} />
            ) : image ? (
              <Image src={image} alt="Preview" objectFit="contain" w="100%" h="100%" p={4} />
            ) : (
              <VStack color={COLORS.text.muted}>
                <LuImage size={40} />
                <Text fontSize="sm">Click to select an image</Text>
              </VStack>
            )}
          </Box>

          {/* Image Actions */}
          {image && (
            <HStack mt={2} gap={2}>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemoveBackground}
                disabled={isProcessingImage}
                color={COLORS.text.primary}
              >
                <LuScissors />
                Remove Background
              </Button>
            </HStack>
          )}
        </Box>

        {/* Price */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
            Price
          </Text>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="Enter price (e.g., 29.99)"
            bg={COLORS.cardDarkLight}
            color={COLORS.text.primary}
            borderColor={COLORS.cardDarkLight}
            _placeholder={{ color: COLORS.text.muted }}
            _focus={{ borderColor: COLORS.primary }}
            type="text"
          />
        </Box>

        {/* URL */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
            URL / Where to find it?
          </Text>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL or location"
            bg={COLORS.cardDarkLight}
            color={COLORS.text.primary}
            borderColor={COLORS.cardDarkLight}
            _placeholder={{ color: COLORS.text.muted }}
            _focus={{ borderColor: COLORS.primary }}
            type="url"
          />
        </Box>

        {/* Description */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
            Description
          </Text>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this item"
            bg={COLORS.cardDarkLight}
            color={COLORS.text.primary}
            borderColor={COLORS.cardDarkLight}
            _placeholder={{ color: COLORS.text.muted }}
            _focus={{ borderColor: COLORS.primary }}
            rows={4}
          />
        </Box>

        {/* Priority Slider */}
        <Box>
          <Slider.Root
            value={[priority + 1]}
            onValueChange={(details) => setPriority(details.value[0] - 1)}
            min={1}
            max={5}
            step={1}
            defaultValue={[1]}
          >
            <HStack justify="space-between" mb={2}>
              <Slider.Label fontSize="sm" fontWeight="medium" color={COLORS.text.primary}>
                Priority
              </Slider.Label>
              <Slider.ValueText fontSize="sm" color={COLORS.text.primary} />
            </HStack>
            <Slider.Control>
              <Slider.Track bg={COLORS.cardDarkLight}>
                <Slider.Range bg={COLORS.primary} />
              </Slider.Track>
              <Slider.Thumb index={0} bg={COLORS.primary} borderColor={COLORS.primary}>
                <Slider.HiddenInput />
              </Slider.Thumb>
              <Slider.Marks 
                marks={[1, 2, 3, 4, 5]} 
              />
            </Slider.Control>
          </Slider.Root>
          <HStack justify="space-between" fontSize="xs" color={COLORS.text.secondary} mt={1}>
            <Text>Lowest</Text>
            <Text>Highest</Text>
          </HStack>
        </Box>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !name || (!isEditMode && !hideWishlistSelector && !selectedWishlistId)}
          bg={COLORS.primary}
          color={COLORS.text.primary}
          size="lg"
          w="100%"
          _hover={{ opacity: 0.8 }}
          _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
        >
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <>
              {isEditMode ? <LuCheck /> : <LuPlus />}
              {submitLabel}
            </>
          )}
        </Button>
      </VStack>
    )
  }
)

ItemForm.displayName = 'ItemForm'