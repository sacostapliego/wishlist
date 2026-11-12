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
  /** The lookup failed; the link is handed back so the manual form can keep it. */
  onScrapeFailure: (url: string) => void
}

export const ScrapeUrlForm = ({ onScrapeSuccess, onScrapeFailure }: ScrapeUrlFormProps) => {
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

    const link = scrapeUrl.trim()
    setIsScraping(true)
    try {
      const result = await wishlistAPI.scrapeUrl(link)
      onScrapeSuccess({
        name: result.name || '',
        price: result.price ? String(result.price) : '',
        url: result.url || link,
        newImageUri: result.image_url || undefined,
        description: '',
        priority: 0,
      })

      // Some shops only give part of it (e.g. the price is loaded by script)
      const missing = [!result.price && 'price', !result.image_url && 'picture'].filter(Boolean)
      toaster.create(
        missing.length
          ? {
              title: 'Mostly filled in',
              description: `Couldn't find the ${missing.join(' or ')} on that page. Add it below.`,
              type: 'info',
            }
          : {
              title: 'Success',
              description: 'Product information retrieved successfully!',
              type: 'success',
            }
      )
    } catch (error) {
      const apiError = error as ApiError
      const reason = apiError?.response?.data?.detail || "We couldn't read that page."
      // Whatever went wrong, carry on by hand with the link already saved
      onScrapeFailure(link)
      toaster.create({
        title: 'Fill in the details',
        description: `${reason} The link has been added for you.`,
        type: 'info',
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
          placeholder="https://..."
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
        Paste a product link from any store to fill in the name, price and picture.
      </Text>
    </VStack>
  )
}