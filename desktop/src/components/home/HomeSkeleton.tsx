'use client'

import { Box, HStack, VStack, SimpleGrid } from '@chakra-ui/react'
import { COLORS } from '../../styles/common'

/**
 * Shimmering placeholder block.
 * Replaces the blank panel the home page used to show while its fetches resolve.
 */
function Sk({ w, h, rounded = 'md' }: { w: string; h: string; rounded?: string }) {
  return (
    <Box
      w={w}
      h={h}
      borderRadius={rounded}
      flexShrink={0}
      css={{
        background: 'linear-gradient(90deg, #1a1a1a 0%, #242424 50%, #1a1a1a 100%)',
        backgroundSize: '200% 100%',
        animation: 'home-skeleton-shimmer 1.4s ease-in-out infinite',
        '@keyframes home-skeleton-shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      }}
    />
  )
}

function SectionHeading() {
  return (
    <HStack justifyContent="space-between" mb={4}>
      <Sk w="160px" h="22px" />
      <Sk w="64px" h="16px" />
    </HStack>
  )
}

export function HomeSkeleton() {
  return (
    <Box w="100%" bg={COLORS.background} py={2} aria-busy="true">
      {/* header */}
      <HStack display={{ base: 'none', md: 'flex' }} px={8} h="72px" gap={4}>
        <Sk w="260px" h="26px" />
        <Box flex="1" />
        <Sk w="40px" h="40px" rounded="full" />
        <Sk w="32px" h="32px" rounded="full" />
      </HStack>

      <VStack align="stretch" gap={7}>
        {/* up next */}
        <Box px={{ base: 4, md: 8 }}>
          <Box bg={COLORS.cardDark} borderRadius="lg" p={5}>
            <HStack gap={5} align="center">
              <Sk w="128px" h="128px" />
              <VStack align="stretch" gap={3} flex="1">
                <Sk w="110px" h="10px" />
                <Sk w="320px" h="28px" />
                <Sk w="200px" h="12px" />
                <Sk w="420px" h="6px" rounded="full" />
              </VStack>
              <Sk w="120px" h="40px" rounded="full" />
            </HStack>
          </Box>
        </Box>

        {/* items claimed */}
        <Box px={{ base: 4, md: 8 }}>
          <SectionHeading />
          <SimpleGrid columns={{ base: 2, md: 3, xl: 4 }} gap={4}>
            {[0, 1, 2, 3].map((i) => (
              <HStack key={i} bg={COLORS.cardDark} borderRadius="lg" gap={0} overflow="hidden" h={{ base: '5rem', md: '6rem' }}>
                <Sk w="96px" h="96px" rounded="none" />
                <VStack align="stretch" gap={2} flex="1" p={3}>
                  <Sk w="100%" h="12px" />
                  <Sk w="60%" h="12px" />
                  <Box flex="1" />
                  <Sk w="40%" h="10px" />
                </VStack>
              </HStack>
            ))}
          </SimpleGrid>
        </Box>

        {/* your lists */}
        <Box px={{ base: 4, md: 8 }}>
          <SectionHeading />
          <HStack gap={4}>
            {[0, 1, 2, 3, 4].map((i) => (
              <VStack key={i} align="stretch" gap={2.5} display={i > 2 ? { base: 'none', lg: 'flex' } : 'flex'}>
                <Sk w="192px" h="192px" />
                <Sk w="140px" h="14px" />
                <Sk w="90px" h="10px" />
              </VStack>
            ))}
          </HStack>
        </Box>
      </VStack>
    </Box>
  )
}

export default HomeSkeleton
