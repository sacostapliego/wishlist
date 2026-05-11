import { useState } from 'react'
import { VStack, Input, Button, Text, Box, Spinner } from '@chakra-ui/react'
import { LuSearch } from 'react-icons/lu'
import { COLORS } from '../../styles/common'
import { wishlistAPI } from '../../services/wishlist'
import { toaster } from '../ui/toaster'
import type { ItemFormData } from './ItemForm'
import type { ApiError } from '../../types/types'

interface ScrapeUrlFormProps {
  onScrapeSuccess: (data: Partial<ItemFormData>) => void
}

export const ScrapeUrlForm = ({ onScrapeSuccess }: ScrapeUrlFormProps) => {
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)

  const handleScrapeUrl = async () => {
    if (!scrapeUrl.trim()) {
      toaster.create({
        title: 'No URL',
        description: 'Please enter a URL to scrape.',
        type: 'error',
      })
      return
    }

    setIsScraping(true)
    try {
      const result = await wishlistAPI.scrapeUrl(scrapeUrl)
      onScrapeSuccess({
        name: result.name || '',
        price: result.price ? String(result.price) : '',
        url: result.url || scrapeUrl,
        newImageUri: result.image_url || undefined,
        description: '',
        priority: 0,
      })
      
      toaster.create({
        title: 'Success',
        description: 'Product information retrieved successfully!',
        type: 'success',
      })
    } catch (error) {
      const apiError = error as ApiError
      const errorMessage =
        apiError?.response?.data?.detail || 'Failed to scrape the URL. The site may be unsupported.'
      toaster.create({
        title: 'Scraping Error',
        description: errorMessage,
        type: 'error',
      })
    } finally {
      setIsScraping(false)
    }
  }

  return (
    <VStack align="stretch" gap={4}>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2} color={COLORS.text.primary}>
          Product URL
        </Text>
        <Input
          placeholder="https://www.amazon.com/..."
          value={scrapeUrl}
          onChange={(e) => setScrapeUrl(e.target.value)}
          bg={COLORS.cardDarkLight}
          color={COLORS.text.primary}
          borderColor={COLORS.cardDarkLight}
          _placeholder={{ color: COLORS.text.muted }}
          _focus={{ borderColor: COLORS.primary }}
          type="url"
        />
      </Box>

      <Button
        onClick={handleScrapeUrl}
        disabled={isScraping || !scrapeUrl}
        bg={COLORS.primary}
        color={COLORS.text.primary}
        size="lg"
        w="100%"
        _hover={{ opacity: 0.8 }}
        _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
      >
        {isScraping ? (
          <Spinner size="sm" />
        ) : (
          <>
            <LuSearch />
            Get Item Info
          </>
        )}
      </Button>

      <Text color={COLORS.text.secondary} fontSize="sm" textAlign="center">
        Enter a link from a supported store (e.g., Amazon) to automatically fill in the details.
      </Text>
    </VStack>
  )
}