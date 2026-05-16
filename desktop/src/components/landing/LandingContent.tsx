'use client'

import { Box, Container, HStack, Text, VStack, Image } from '@chakra-ui/react'
import { FaSafari } from 'react-icons/fa'
import { HoverArrowButton } from '@/components/landing/HoverArrowButton'
import { FeaturesSection } from '@/components/landing/FeaturesSection'

const APP_ENTRY = '/auth/login'

export function LandingContent() {
  return (
    <VStack align="start" gap={12} pt={8}>
      <Container
        id="hero"
        display="flex"
        flexDirection="column"
        alignItems="center"
        textAlign="center"
      >
        <Text mb={14} fontSize={{ base: '4xl', md: '6xl' }} fontWeight="bold">
          A modern way to create, share, and manage your wishlist
        </Text>

        <HoverArrowButton
          href={APP_ENTRY}
          bg="#C41E3A"
          color="white"
          px={6}
          py={8}
          borderRadius="16px"
          leftIcon={FaSafari}
          mb={16}
        >
          Go To Wishlist App
        </HoverArrowButton>

        <HStack justify="center" gap={0} w="full" flex={1}>
          <Image
            h={{ base: '1xl', md: '3xl' }}
            src="/landing/screenshots/2-portrait.png"
            alt="Wishlist app screenshot"
            display={{ base: 'none', md: 'block' }}
          />
          <Image
            h={{ base: '2xl', md: '4xl' }}
            src="/landing/screenshots/1-portrait.png"
            alt="Wishlist app screenshot"
          />
          <Image
            h={{ base: '1xl', md: '3xl' }}
            src="/landing/screenshots/3-portrait.png"
            alt="Wishlist app screenshot"
            display={{ base: 'none', md: 'block' }}
          />
        </HStack>
        <Box h="5vh" />
      </Container>

      <Container id="features" w="container.sm">
        <FeaturesSection />
      </Container>

      <Container id="link-to-app" maxW="container.sm" textAlign="center">
        <HoverArrowButton
          href={APP_ENTRY}
          bg="#C41E3A"
          color="white"
          px={6}
          py={8}
          borderRadius="16px"
          leftIcon={FaSafari}
          mb={16}
        >
          Go To Wishlist App
        </HoverArrowButton>
      </Container>
    </VStack>
  )
}
