import { Box, Button, VStack, Text, Slider, HStack } from '@chakra-ui/react'
import { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { COLORS } from '../../styles/common'

interface ProfileImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedImageBlob: Blob) => void
  onCancel: () => void
  circularCrop?: boolean  // default true for profile, false for wishlist
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ProfileImageCropper({ 
  imageSrc, 
  onCropComplete, 
  onCancel,
  circularCrop = true  // keeps existing profile behavior unchanged
}: ProfileImageCropperProps) {  
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const imgRef = useRef<HTMLImageElement>(null)
  const [scale, setScale] = useState(1)

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const pixelRatio = window.devicePixelRatio
    const outputSize = 400 // Output size for profile picture

    canvas.width = outputSize * pixelRatio
    canvas.height = outputSize * pixelRatio

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    ctx.imageSmoothingQuality = 'high'

    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY

    ctx.save()

    // Apply transformations
    ctx.translate(outputSize / 2, outputSize / 2)
    ctx.scale(scale, scale)
    ctx.translate(-outputSize / 2, -outputSize / 2)

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputSize,
      outputSize
    )

    ctx.restore()

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        0.95
      )
    })
  }, [completedCrop, scale])

  const handleSave = async () => {
    try {
      const croppedBlob = await getCroppedImg()
      if (croppedBlob) {
        onCropComplete(croppedBlob)
      }
    } catch (error) {
      console.error('Error cropping image:', error)
    }
  }

  return (
    <VStack align="stretch" gap={4}>
      <Box
        position="relative"
        w="100%"
        maxH="60vh"
        overflow="auto"
        bg={COLORS.cardDarkLight}
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={1}
          circularCrop={circularCrop}
        >
          <img
            ref={imgRef}
            alt="Crop preview"
            src={imageSrc}
            style={{
              transform: `scale(${scale})`,
              maxWidth: '100%',
              maxHeight: '50vh',
            }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      </Box>

      <VStack align="stretch" gap={3}>
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
            Zoom
          </Text>
          <Slider.Root
            value={[scale]}
            onValueChange={(details) => setScale(details.value[0])}
            min={0.5}
            max={3}
            step={0.1}
          >
            <Slider.Control>
              <Slider.Track bg={COLORS.cardDarkLight}>
                <Slider.Range bg={COLORS.primary} />
              </Slider.Track>
              <Slider.Thumb index={0} bg={COLORS.primary} borderColor={COLORS.primary}>
                <Slider.HiddenInput />
              </Slider.Thumb>
            </Slider.Control>
          </Slider.Root>
        </Box>
      </VStack>

      <HStack gap={2} mt={4}>
        <Button flex={1} onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button flex={1} onClick={handleSave} bg={COLORS.primary} color="white">
          Save
        </Button>
      </HStack>
    </VStack>
  )
}