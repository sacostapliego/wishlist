'use client'

import { useEffect, useState, useRef } from 'react'
import NextLink from 'next/link'
import {
  Box,
  Flex,
  HStack,
  Button,
  IconButton,
  Stack,
  Text,
  Drawer,
} from '@chakra-ui/react'
import { GiHamburgerMenu } from 'react-icons/gi'
import { FaGear, FaCode } from 'react-icons/fa6'
import { FaSafari } from 'react-icons/fa'
import { HoverArrowButton } from '@/components/landing/HoverArrowButton'
import { HoverSwapLogo } from '@/components/landing/HoverSwapLogo'

const navLinks = [
  { label: 'Frontend', href: '/frontend', icon: FaCode },
  { label: 'Backend', href: '/backend', icon: FaGear },
]

const ICON_SRC = '/landing/icons/icon.png'

interface LandingHeaderProps {
  brand?: string
  transparentUntil?: string
  appEntryHref?: string
}

export function LandingHeader({
  brand = 'Cardinal Wishlist',
  transparentUntil = '#hero',
  appEntryHref = '/auth/login',
}: LandingHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMounted, setDrawerMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [overHero, setOverHero] = useState(false)
  const headerRef = useRef<HTMLDivElement | null>(null)

  // Drawer (Ark) emits different dialog trigger ids on SSR vs the client; defer mounting until after the first paint so HTML matches hydration.
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawerMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const update = () => {
      const headerH = headerRef.current?.offsetHeight ?? 64
      const el = document.querySelector(transparentUntil)

      setScrolled(window.scrollY > 0)

      if (!el) {
        setOverHero(false)
        return
      }

      const rect = el.getBoundingClientRect()
      setOverHero(rect.bottom > headerH)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [transparentUntil])

  const solidBg = '#141414'
  const blurBg = 'rgba(20,20,20,0.55)'
  const isBlur = scrolled && overHero
  const bg = isBlur ? blurBg : solidBg
  const backdrop = isBlur ? 'saturate(180%) blur(10px)' : 'none'

  return (
    <Box
      ref={headerRef}
      as="header"
      position="sticky"
      top={0}
      zIndex="banner"
      bg={bg}
      color="whiteAlpha.900"
      backdropFilter={backdrop}
      transition="background-color 0.2s ease, border-color 0.2s ease, backdrop-filter 0.2s ease"
      css={{
        '& button:focus, & a:focus': { outline: 'none', boxShadow: 'none' },
      }}
    >
      <Flex
        as="nav"
        mx="auto"
        w="100%"
        maxW="7xl"
        px={{ base: 4, md: 6 }}
        h={{ base: '96px', '2xl': '150px' }}
        align="center"
        justify="space-between"
      >
        <HStack gap={3}>
          <HoverSwapLogo
            href="/"
            imgSrc={ICON_SRC}
            imgAlt={`${brand} logo`}
            text={brand}
            boxSize="42px"
            borderRadius="8px"
            borderColor="white"
            borderWidth="2px"
            p={1}
          />
        </HStack>

        <HStack gap={1} display={{ base: 'none', md: 'flex' }}>
          {navLinks.map((l) => {
            const Icon = l.icon
            return (
              <Button
                key={l.label}
                asChild
                variant="ghost"
                size="lg"
                fontWeight="semibold"
                borderRadius="8px"
                _hover={{ '& .nav-icon': { transform: 'rotate(-15deg)' } }}
              >
                <NextLink href={l.href}>
                  <HStack gap={2}>
                    <Box
                      as={Icon}
                      className="nav-icon"
                      fontSize="lg"
                      transition="transform 200ms ease"
                      willChange="transform"
                    />
                    <Text>{l.label}</Text>
                  </HStack>
                </NextLink>
              </Button>
            )
          })}
          <HStack gap={2} pl={2}>
            <HoverArrowButton
              href={appEntryHref}
              bg="#1e1e1e"
              color="white"
              px={6}
              borderRadius="16px"
              leftIcon={FaSafari}
              py={8}
            >
              Go To Wishlist App
            </HoverArrowButton>
          </HStack>
        </HStack>

        {drawerMounted ? (
          <Drawer.Root
            placement="end"
            open={drawerOpen}
            onOpenChange={(e) => setDrawerOpen(e.open)}
          >
            <Drawer.Trigger asChild>
              <IconButton
                variant="ghost"
                display={{ base: 'inline-flex', md: 'none' }}
                colorPalette="gray"
                aria-label="Open menu"
              >
                <GiHamburgerMenu />
              </IconButton>
            </Drawer.Trigger>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content>
                <Drawer.CloseTrigger />
                <Drawer.Header>
                  <Drawer.Title>Menu</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body>
                  <Stack gap={2} pt={2}>
                    {navLinks.map((l) => {
                      const Icon = l.icon
                      return (
                        <Button
                          key={l.label}
                          asChild
                          variant="ghost"
                          justifyContent="flex-start"
                          role="group"
                          onClick={() => setDrawerOpen(false)}
                        >
                          <NextLink href={l.href}>
                            <HStack gap={2}>
                              <Box
                                as={Icon}
                                fontSize="lg"
                                transition="transform 200ms ease"
                                willChange="transform"
                                _groupHover={{ transform: 'rotate(-15deg)' }}
                              />
                              <Text>{l.label}</Text>
                            </HStack>
                          </NextLink>
                        </Button>
                      )
                    })}
                    <Button asChild colorPalette="blue" onClick={() => setDrawerOpen(false)}>
                      <a href={appEntryHref}>Get started</a>
                    </Button>
                  </Stack>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Drawer.Root>
        ) : (
          <IconButton
            variant="ghost"
            display={{ base: 'inline-flex', md: 'none' }}
            colorPalette="gray"
            aria-label="Open menu"
          >
            <GiHamburgerMenu />
          </IconButton>
        )}
      </Flex>
    </Box>
  )
}
