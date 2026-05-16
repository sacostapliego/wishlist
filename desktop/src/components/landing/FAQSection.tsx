'use client'

import { useState } from 'react'
import { Container, VStack, Box, Text, HStack } from '@chakra-ui/react'
import { FaPlus, FaMinus } from 'react-icons/fa6'
import type { FaqItem } from '@/data/faqData'

interface FAQSectionProps {
  faqs: FaqItem[]
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const [openId, setOpenId] = useState<number | null>(null)

  const toggle = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <Container maxW={{ base: '60vw', md: 'container.md' }}>
      <VStack gap={0} align="stretch">
        {faqs.map((faq, index) => {
          const isOpen = openId === faq.id

          return (
            <Box key={faq.id}>
              <Box onClick={() => toggle(faq.id)} cursor="pointer" py={6}>
                <HStack gap={4} align="flex-start">
                  <Box
                    className="faq-icon"
                    transition="transform 300ms ease"
                    transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
                    mt={1}
                    flexShrink={0}
                  >
                    {isOpen ? <FaMinus size={18} /> : <FaPlus size={18} />}
                  </Box>
                  <Box flex="1">
                    <Text fontSize="xl" fontWeight="bold">
                      {faq.question}
                    </Text>

                    <Box
                      overflow="hidden"
                      transition="all 200ms ease"
                      maxH={isOpen ? '200px' : '0'}
                      opacity={isOpen ? 1 : 0}
                    >
                      <Text mt={4} color="whiteAlpha.800" fontSize="lg">
                        {faq.answer}
                      </Text>
                    </Box>
                  </Box>
                </HStack>
              </Box>

              {index < faqs.length - 1 && <Box h="1px" bg="whiteAlpha.200" />}
            </Box>
          )
        })}
      </VStack>
    </Container>
  )
}
