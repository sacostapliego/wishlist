import { 
  Box, 
  VStack, 
  Input, 
  Textarea, 
  Button, 
  Text,
  Switch,
  HStack,
  SimpleGrid,
  IconButton
} from '@chakra-ui/react'
import { BsGrid, BsList } from "react-icons/bs";
import { useState, useImperativeHandle, forwardRef } from 'react'
import { COLORS } from '../../styles/common'
import { WISHLIST_COLORS } from '../../styles/colors'
import { ThumbnailPicker } from './ThumbnailPicker'

interface WishlistFormData {
  title: string
  description: string
  color: string
  is_public: boolean
  image: string
  thumbnail_type: 'icon' | 'image'
  thumbnail_icon: string | null
  thumbnail_image: File | null
  remove_thumbnail_image?: boolean
  use_item_colors?: boolean
  default_view?: 'grid' | 'list'  
  due_date?: string | null
}

interface WishlistFormProps {
  initialValues?: Partial<WishlistFormData> & {
    /** Existing uploaded thumbnail image URL (for edit mode) */
    existing_thumbnail_image_url?: string | null
  }
  onSubmit: (data: WishlistFormData) => Promise<void> | void
  isLoading?: boolean
  submitLabel?: string
  /** Whether we are in edit mode (affects remove_thumbnail_image logic) */
  isEditMode?: boolean
}

export interface WishlistFormRef {
  resetForm: () => void
}

export const WishlistForm = forwardRef<WishlistFormRef, WishlistFormProps>(({
  initialValues = {},
  onSubmit,
  isLoading,
  submitLabel = "Save Wishlist",
  isEditMode = false
}, ref) => {
  const [title, setTitle] = useState(initialValues.title || '')
  const [description, setDescription] = useState(initialValues.description || '')
  const [isPublic, setIsPublic] = useState(initialValues.is_public || false)
  const [selectedColor, setSelectedColor] = useState(initialValues.color || COLORS.primary)
  const [selectedImage, setSelectedImage] = useState(initialValues.image || 'gift-outline')
  const [useItemColors, setUseItemColors] = useState(initialValues.use_item_colors ?? true)
  const [defaultView, setDefaultView] = useState<'grid' | 'list'>(initialValues.default_view || 'list')
  const [dueDate, setDueDate] = useState<string>(initialValues.due_date || '')
  
  // Thumbnail state
  const [thumbnailType, setThumbnailType] = useState<'icon' | 'image'>(
    initialValues.thumbnail_type || 'icon'
  )
  const [thumbnailIcon, setThumbnailIcon] = useState<string>(
    initialValues.thumbnail_icon || initialValues.image || 'gift-outline'
  )
  const [thumbnailImageFile, setThumbnailImageFile] = useState<File | null>(null)
  const [existingThumbnailImageUrl, setExistingThumbnailImageUrl] = useState<string | null>(
    initialValues.existing_thumbnail_image_url || null
  )
  // Track if user switched from image to icon (so we send remove_thumbnail_image)
  const [hadExistingImage] = useState(
    initialValues.thumbnail_type === 'image' && !!initialValues.existing_thumbnail_image_url
  )

  const handleThumbnailTypeChange = (type: 'icon' | 'image') => {
    setThumbnailType(type)
    if (type === 'icon') {
      // Clear any selected image file when switching to icon
      setThumbnailImageFile(null)
    }
  }

  const handleImageSelect = (file: File | null) => {
    setThumbnailImageFile(file)
    if (!file) {
      setExistingThumbnailImageUrl(null)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    
    const shouldRemoveThumbnailImage = 
      isEditMode && hadExistingImage && thumbnailType === 'icon'
    
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      color: selectedColor,
      is_public: isPublic,
      image: thumbnailType === 'icon' ? thumbnailIcon : selectedImage,
      thumbnail_type: thumbnailType,
      thumbnail_icon: thumbnailType === 'icon' ? thumbnailIcon : null,
      thumbnail_image: thumbnailType === 'image' ? thumbnailImageFile : null,
      use_item_colors: useItemColors,
      default_view: defaultView,
      due_date: dueDate || null,
      ...(shouldRemoveThumbnailImage ? { remove_thumbnail_image: true } : {})
    })
    
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setIsPublic(false)
    setSelectedColor('#ff7f50')
    setSelectedImage('gift-outline')
    setThumbnailType('icon')
    setThumbnailIcon('gift-outline')
    setThumbnailImageFile(null)
    setExistingThumbnailImageUrl(null)
    setUseItemColors(false)
    setDefaultView('grid')
    setDueDate('')
  }
  
  useImperativeHandle(ref, () => ({
    resetForm
  }))
  
  return (
    <VStack align="stretch" gap={6} p={6}>
      <Box>
        {/* Select image/icon first */}
        <ThumbnailPicker
          thumbnailType={thumbnailType}
          selectedIcon={thumbnailIcon}
          existingImageUrl={existingThumbnailImageUrl}
          selectedImageFile={thumbnailImageFile}
          onThumbnailTypeChange={handleThumbnailTypeChange}
          onIconSelect={setThumbnailIcon}
          onImageSelect={handleImageSelect}
        />

        <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.secondary}>
          Title
        </Text>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Wishlist"
          bg={COLORS.cardGray}
          border="none"
          _placeholder={{ color: COLORS.inactive }}
          _focus={{ bg: COLORS.cardDarkLight }}
          color={COLORS.text.secondary}
        />
      </Box>
      
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.secondary}>
          Description (Optional)
        </Text>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this wishlist for?"
          bg={COLORS.cardGray}
          border="none"
          _placeholder={{ color: COLORS.inactive }}
          _focus={{ bg: COLORS.cardDarkLight }}
          minH="100px"
          resize="vertical"
        />
      </Box>
      
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={3} color={COLORS.text.secondary}>
          Color
        </Text>
        <SimpleGrid columns={{ base: 6, md: 10 }} gap={3}>
          {Object.values(WISHLIST_COLORS).map((color) => (
            <Box
              key={color}
              w="40px"
              h="40px"
              borderRadius="md"
              bg={color}
              cursor="pointer"
              border={selectedColor === color ? '3px solid white' : '3px solid transparent'}
              transition="all 0.2s"
              _hover={{ transform: 'scale(1.1)' }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </SimpleGrid>
      </Box>

      {/* Use Item Colors Toggle */}
      <HStack justify="space-between" align="center">
        <Text fontSize="sm" fontWeight="medium" color={COLORS.text.secondary}>
          Use Wishlist Color on Items
        </Text>
        <Switch.Root checked={useItemColors} onCheckedChange={(e) => setUseItemColors(e.checked)} colorPalette="red">
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Root>
      </HStack>

      <HStack justify="space-between" align="center">
        <Text fontSize="sm" fontWeight="medium" color={COLORS.text.secondary}>
          Make Public
        </Text>
        <Switch.Root checked={isPublic} onCheckedChange={(e) => setIsPublic(e.checked)} colorPalette="red">
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Root>
      </HStack>

      {/* Default View Toggle */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.secondary}>
          Default View
        </Text>
        <HStack gap={2}>
          <IconButton
            aria-label="List view"
            flex={1}
            variant={defaultView === 'list' ? 'solid' : 'ghost'}
            bg={defaultView === 'list' ? selectedColor : COLORS.cardGray}
            color="white"
            borderRadius="md"
            size="lg"
            onClick={() => setDefaultView('list')}
            _hover={{ bg: defaultView === 'list' ? selectedColor : COLORS.cardDarkLight }}
          >
            <BsList />
          </IconButton>
          <IconButton
            aria-label="Grid view"
            flex={1}
            variant={defaultView === 'grid' ? 'solid' : 'ghost'}
            bg={defaultView === 'grid' ? selectedColor : COLORS.cardGray}
            color="white"
            borderRadius="md"
            size="lg"
            onClick={() => setDefaultView('grid')}
            _hover={{ bg: defaultView === 'grid' ? selectedColor : COLORS.cardDarkLight }}
          >
            <BsGrid />
          </IconButton>
        </HStack>
      </Box>

      {/* Due Date */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.secondary}>
          Due Date <Text as="span" color={COLORS.inactive}>(Optional)</Text>
        </Text>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          bg={COLORS.cardGray}
          border="none"
          color={dueDate ? 'white' : COLORS.inactive}
          _focus={{ bg: COLORS.cardDarkLight }}
          colorScheme="whiteAlpha"
        />
        {dueDate && (
          <Button
            size="xs"
            variant="ghost"
            color={COLORS.inactive}
            mt={1}
            onClick={() => setDueDate('')}
          >
            Clear date
          </Button>
        )}
      </Box>

      
      <Button
        onClick={handleSubmit}
        colorScheme="blue"
        size="lg"
        mt={4}
        disabled={isLoading || !title.trim()}
        loading={isLoading}
      >
        {submitLabel}
      </Button>
    </VStack>
  )
})

WishlistForm.displayName = 'WishlistForm'