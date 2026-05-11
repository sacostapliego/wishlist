import { Box, Button, VStack, Text, Slider, HStack } from '@chakra-ui/react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { COLORS } from '../../styles/common'

interface ThumbnailCropperProps {
  imageSrc: string
  onCropComplete: (croppedBlob: Blob) => void
  onCancel: () => void
}

export function ThumbnailCropper({ imageSrc, onCropComplete, onCancel }: ThumbnailCropperProps) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const CROP_SIZE = 260 // px — the visible square crop area

  // Load image once
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      setImageSize({ w: img.naturalWidth, h: img.naturalHeight })
      setScale(1)
      setOffset({ x: 0, y: 0 })
    }
    img.src = imageSrc
  }, [imageSrc])

  // Redraw canvas whenever scale/offset/image changes
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CROP_SIZE * dpr
    canvas.height = CROP_SIZE * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Transparent background — no fillRect
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE)

    // Fit image to fill the crop square at scale 1
    const fitScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
    const drawW = img.naturalWidth * fitScale * scale
    const drawH = img.naturalHeight * fitScale * scale

    // Clamp offset so image always covers the crop area
    const minX = Math.min(0, CROP_SIZE - drawW)
    const minY = Math.min(0, CROP_SIZE - drawH)
    const clampedX = Math.max(minX, Math.min(0, offset.x))
    const clampedY = Math.max(minY, Math.min(0, offset.y))

    ctx.drawImage(img, clampedX, clampedY, drawW, drawH)
  }, [scale, offset, imageSize])

  const clampOffset = useCallback(
    (x: number, y: number, currentScale: number) => {
      const img = imageRef.current
      if (!img) return { x, y }
      const fitScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
      const drawW = img.naturalWidth * fitScale * currentScale
      const drawH = img.naturalHeight * fitScale * currentScale
      const minX = Math.min(0, CROP_SIZE - drawW)
      const minY = Math.min(0, CROP_SIZE - drawH)
      return {
        x: Math.max(minX, Math.min(0, x)),
        y: Math.max(minY, Math.min(0, y)),
      }
    },
    []
  )

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const raw = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
    setOffset(clampOffset(raw.x, raw.y, scale))
  }

  const handleMouseUp = () => setIsDragging(false)

  // Touch drag
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const raw = { x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y }
    setOffset(clampOffset(raw.x, raw.y, scale))
  }

  const handleScaleChange = (newScale: number) => {
    setScale(newScale)
    setOffset((prev) => clampOffset(prev.x, prev.y, newScale))
  }

  const handleSave = useCallback(async () => {
    const img = imageRef.current
    if (!img) return

    const outputSize = 400
    const dpr = window.devicePixelRatio || 1
    const offscreen = document.createElement('canvas')
    offscreen.width = outputSize * dpr
    offscreen.height = outputSize * dpr
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, outputSize, outputSize) // keep transparency

    const fitScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
    const drawW = img.naturalWidth * fitScale * scale
    const drawH = img.naturalHeight * fitScale * scale
    const clampedOffset = clampOffset(offset.x, offset.y, scale)

    // Scale up to output size
    const ratio = outputSize / CROP_SIZE
    ctx.drawImage(
      img,
      clampedOffset.x * ratio,
      clampedOffset.y * ratio,
      drawW * ratio,
      drawH * ratio
    )

    offscreen.toBlob(
      (blob) => {
        if (blob) onCropComplete(blob)
      },
      'image/png', // PNG to preserve transparency
      1.0
    )
  }, [scale, offset, clampOffset, onCropComplete])

  return (
    <VStack align="stretch" gap={4}>
      {/* Crop canvas */}
      <Box display="flex" justifyContent="center">
        <Box
          ref={containerRef}
          position="relative"
          w={`${CROP_SIZE}px`}
          h={`${CROP_SIZE}px`}
          borderRadius="xl"
          overflow="hidden"
          cursor={isDragging ? 'grabbing' : 'grab'}
          userSelect="none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          // Checkerboard pattern so transparent areas are visible
          backgroundImage="linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)"
          backgroundSize="16px 16px"
          backgroundPosition="0 0, 0 8px, 8px -8px, -8px 0px"
          bg="#1a1a1a"
        >
          <canvas
            ref={canvasRef}
            style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px`, display: 'block' }}
          />
        </Box>
      </Box>

      <Text fontSize="xs" color={COLORS.text.muted} textAlign="center">
        Drag to reposition
      </Text>

      {/* Zoom slider */}
      <VStack align="stretch" gap={2}>
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight="medium" color={COLORS.text.primary}>
            Zoom
          </Text>
          <Text fontSize="xs" color={COLORS.text.muted}>
            {Math.round(scale * 100)}%
          </Text>
        </HStack>
        <Slider.Root
          value={[scale]}
          onValueChange={(details) => handleScaleChange(details.value[0])}
          min={1}
          max={3}
          step={0.05}
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
      </VStack>

      {/* Actions */}
      <HStack gap={2}>
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