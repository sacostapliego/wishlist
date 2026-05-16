'use client'

import NextLink from 'next/link'
import { Box, Text, Image, Link } from '@chakra-ui/react'
import { FaArrowLeft } from 'react-icons/fa6'
import type { IconType } from 'react-icons'

interface HoverSwapLogoProps {
  href: string
  text: string
  imgSrc: string
  imgAlt?: string
  rightIcon?: IconType
  boxSize?: string
  borderRadius?: string | number
  borderColor?: string
  borderWidth?: string | number
  p?: number | string
  filter?: string
  gap?: number
}

export function HoverSwapLogo({
  href,
  text,
  imgSrc,
  imgAlt = '',
  rightIcon: RightIcon = FaArrowLeft,
  boxSize = '42px',
  borderRadius = '8px',
  borderColor = 'white',
  borderWidth = '2px',
  p = 1,
  filter = 'brightness(0) invert(1)',
  gap = 3,
}: HoverSwapLogoProps) {
  return (
    <Link
      asChild
      display="inline-flex"
      alignItems="center"
      _hover={{
        textDecoration: 'none',
        '& .swap-img': {
          transform: 'translateX(-8px)',
          opacity: 0,
        },
        '& .swap-icon': {
          opacity: 1,
          transform: 'translate(-50%, -50%) translateX(0)',
        },
      }}
      _focus={{ outline: 'none', boxShadow: 'none' }}
      _focusVisible={{ outline: 'none', boxShadow: 'none' }}
    >
      <NextLink
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
        }}
      >
        <Box
          position="relative"
          w={boxSize}
          h={boxSize}
          borderRadius={borderRadius}
          borderWidth={typeof borderWidth === 'number' ? `${borderWidth}px` : borderWidth}
          borderColor={borderColor}
          p={p}
          mr={gap}
          overflow="hidden"
          flex="0 0 auto"
        >
          <Image
            className="swap-img"
            src={imgSrc}
            alt={imgAlt}
            w="100%"
            h="100%"
            objectFit="contain"
            filter={filter}
            transition="all 200ms ease"
            willChange="transform, opacity"
          />
          <Box
            className="swap-icon"
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%) translateX(8px)"
            opacity={0}
            transition="all 200ms ease"
            willChange="transform, opacity"
            pointerEvents="none"
            color="white"
          >
            <RightIcon size={16} aria-hidden="true" />
          </Box>
        </Box>
        <Text fontWeight="semibold" letterSpacing="-0.02em" fontSize="x-large">
          {text}
        </Text>
      </NextLink>
    </Link>
  )
}
