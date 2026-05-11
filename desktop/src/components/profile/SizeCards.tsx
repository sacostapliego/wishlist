import { Box, Grid, Text, VStack } from '@chakra-ui/react'
import { 
  LuShirt, 
  LuDiamond, 
} from 'react-icons/lu'
import { PiSneaker, PiDress, PiPants } from 'react-icons/pi'
import { LiaHatCowboySideSolid } from "react-icons/lia";
import { TbJacket } from "react-icons/tb";
import { COLORS } from '../../styles/common'

type SizeKey=
  | 'shoe_size'
  | 'shirt_size'
  | 'pants_size'
  | 'hat_size'
  | 'ring_size'
  | 'dress_size'
  | 'jacket_size'

type SizeValues = Partial<Record<SizeKey, string | null | undefined>>

const SIZE_FIELDS: { key: SizeKey; label: string }[] = [
  { key: 'shoe_size', label: 'Shoes' },
  { key: 'shirt_size', label: 'Shirts' },
  { key: 'pants_size', label: 'Pants' },
  { key: 'hat_size', label: 'Hats' },
  { key: 'ring_size', label: 'Rings' },
  { key: 'dress_size', label: 'Dresses' },
  { key: 'jacket_size', label: 'Jackets' },
]

const ICON_MAP: Record<SizeKey, React.ReactNode> = {
  shoe_size: <PiSneaker />,
  shirt_size: <LuShirt />,
  pants_size: <PiPants />,
  hat_size: <LiaHatCowboySideSolid />,
  ring_size: <LuDiamond />,
  dress_size: <PiDress />,
  jacket_size: <TbJacket />,
}

export function SizeCards({ values }: { values: SizeValues }) {
  const visibleSizeItems = SIZE_FIELDS
    .map(sizeField => ({ ...sizeField, value: values[sizeField.key] }))
    .filter(
      (sizeEntry): sizeEntry is { key: SizeKey; label: string; value: string } =>
        typeof sizeEntry.value === 'string' && sizeEntry.value.trim().length > 0
    )

  if (visibleSizeItems.length === 0) return null

  return (
    <Grid
      templateColumns={{ base: 'repeat(auto-fill, minmax(10rem, 1fr))', md: 'repeat(auto-fill, minmax(12rem, 1fr))' }}
      gap="0.75rem"
      w="100%"
    >
      {visibleSizeItems.map(sizeItem => (
        <Box
          key={sizeItem.key}
          bg={COLORS.cardGray}
          p="1rem"
          borderRadius="xl"
          position="relative"
          overflow="hidden"
          h={{ base: '10rem', md: '12rem' }}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          _hover={{
            transform: 'translateY(-0.25rem)',
            transition: 'transform 0.2s'
          }}
        >
          <VStack align="start" gap="0.5rem" position="relative" zIndex={1}>
            <Text 
              fontSize="0.875rem" 
              color={COLORS.text.secondary}
              fontWeight="medium"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              {sizeItem.label}
            </Text>
            <Text 
              fontSize="1.875rem" 
              fontWeight="bold" 
              color="white"
              lineHeight="1"
            >
              {sizeItem.value}
            </Text>
          </VStack>

          <Box
            position="absolute"
            bottom="-0.6rem"
            right="-0.6rem"
            fontSize="7rem"
            color="whiteAlpha.400"
            opacity={0.5}
            pointerEvents="none"
          >
            {ICON_MAP[sizeItem.key]}
          </Box>
        </Box>
      ))}
    </Grid>
  )
}