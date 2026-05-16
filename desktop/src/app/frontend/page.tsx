'use client'

import { Container, Text, VStack } from '@chakra-ui/react'
import { LandingLayout } from '@/components/landing/LandingLayout'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { FaReact } from 'react-icons/fa'
import { SiTypescript, SiExpo, SiRender } from 'react-icons/si'
import type { IconType } from 'react-icons'

const defaultFeatures: { icon: IconType; label: string }[] = [
  { icon: SiTypescript, label: 'Type\nSafety' },
  { icon: FaReact, label: 'Modern\nUI' },
  { icon: SiExpo, label: 'Cross\nPlatform' },
  { icon: SiRender, label: 'Web\nDeployment' },
]

export default function FrontendDocPage() {
  return (
    <LandingLayout>
      <VStack align="start" gap={12} pt={8} minH="100vh">
        <Container
          id="hero"
          maxW="container.lg"
          display="flex"
          flexDirection="column"
          alignItems="center"
          textAlign="center"
        >
          <Text mb={14} fontSize="xl" fontWeight="bold">
            {/* [IMAGE OF FRONEND ARCHITECTURE DIAGRAM HERE] */}
          </Text>
        </Container>
        <FeaturesSection features={defaultFeatures} />
      </VStack>
    </LandingLayout>
  )
}
