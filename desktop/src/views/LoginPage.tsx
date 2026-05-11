'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Button, Input, VStack, Text, Heading, Container } from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import { toaster } from '../components/ui/toaster'
import { COLORS } from '../styles/common'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      toaster.create({ title: 'Error', description: 'Enter email and password.', type: 'error' })
      return
    }

    try {
      setIsLoading(true)
      const response = await login(email, password)
      if (response?.user) {
        toaster.create({ title: 'Success', description: 'Logged in successfully!', type: 'success' })
        router.push('/')
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? (e instanceof Error ? e.message : 'Login failed.')
      toaster.create({ title: 'Error', description: msg, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyles = {
    size: 'lg' as const,
    bg: '#1a1a1a',
    border: '2px solid',
    borderColor: COLORS.primary,
    color: 'white',
    _placeholder: { color: 'white' },
  }

  return (
    <Box minH="100vh" bg={COLORS.background} display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md">
        <VStack gap={6} bg="#141414" p={8} borderRadius="xl">
          <VStack gap={2} w="100%" alignItems="flex-start">
            <Heading size="2xl" color="white">Welcome Back</Heading>
            <Text color={COLORS.text.secondary}>Sign in to continue</Text>
          </VStack>

          <VStack gap={4} w="100%">
            <Input
              {...inputStyles}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <Input
              {...inputStyles}
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button
              w="100%"
              size="lg"
              background={COLORS.primary}
              color="white"
              onClick={handleLogin}
              loading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>
            <Text color={COLORS.text.secondary} fontSize="sm" textAlign="center">
              Don't have an account?{' '}
              <Text
                as="span"
                color={COLORS.primary}
                fontWeight="semibold"
                cursor="pointer"
                onClick={() => router.push('/auth/register')}
                _hover={{ textDecoration: 'underline' }}
              >
                Register here
              </Text>
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}