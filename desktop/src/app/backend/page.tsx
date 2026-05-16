'use client'

import { Container, Image, Text, VStack } from '@chakra-ui/react'
import { LandingLayout } from '@/components/landing/LandingLayout'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { FAQSection } from '@/components/landing/FAQSection'
import { faqData } from '@/data/faqData'
import { FaAws } from 'react-icons/fa'
import { SiRender } from 'react-icons/si'
import { RiSupabaseFill } from 'react-icons/ri'
import type { IconType } from 'react-icons'

const defaultFeatures: { icon: IconType; label: string }[] = [
  { icon: RiSupabaseFill, label: 'Database\nIntegration' },
  { icon: FaAws, label: 'Image\nHandling' },
  { icon: SiRender, label: 'API\nDeployment' },
]

export default function BackendDocPage() {
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
            <Image
              src="/landing/drawings/backend-fastapi.png"
              alt="Backend illustration"
              borderRadius={16}
              boxShadow="md"
            />
          </Text>
        </Container>
        <FAQSection faqs={faqData} />
        <FeaturesSection features={defaultFeatures} columns={{ base: 3, md: 3 }} />
      </VStack>
    </LandingLayout>
  )
}
