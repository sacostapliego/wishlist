'use client'

import { Button, Box, Flex, Text } from '@chakra-ui/react'
import type { ButtonProps } from '@chakra-ui/react'
import { FaSafari } from 'react-icons/fa'
import { FaArrowRight } from 'react-icons/fa6'
import type { IconType } from 'react-icons'

export type HoverArrowButtonProps = Omit<ButtonProps, 'asChild' | 'children'> & {
  href: string
  children?: React.ReactNode
  leftIcon?: IconType
  rightIcon?: IconType
  openInNewTab?: boolean
}

export function HoverArrowButton({
  href,
  children = 'Go To Wishlist App',
  leftIcon: LeftIcon = FaSafari,
  rightIcon: RightIcon = FaArrowRight,
  bg = '#C41E3A',
  color = 'white',
  px = 8,
  py = 6,
  borderRadius = '16px',
  openInNewTab = false,
  ...props
}: HoverArrowButtonProps) {
  return (
    <Button
      asChild
      bg={bg}
      color={color}
      px={px}
      borderRadius={borderRadius}
      fontWeight="semibold"
      fontSize="lg"
      position="relative"
      overflow="hidden"
      transition="background 150ms ease"
      py={py}
      _hover={{
        '& .cta-left': {
          transform: 'translateX(-8px)',
          opacity: 0,
          width: 0,
          marginRight: 0,
        },
        '& .cta-right': {
          transform: 'translateX(0)',
          opacity: 1,
          width: '20px',
          marginLeft: '8px',
        },
      }}
      {...props}
    >
      <a
        href={href}
        {...(openInNewTab
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        <Flex as="span" align="center">
          <Box
            className="cta-left"
            display="inline-flex"
            justifyContent="center"
            alignItems="center"
            w="20px"
            mr="8px"
            transition="all 200ms ease"
            opacity={1}
          >
            <LeftIcon size={18} aria-hidden="true" />
          </Box>
          <Text className="cta-text" whiteSpace="nowrap">
            {children}
          </Text>
          <Box
            className="cta-right"
            display="inline-flex"
            justifyContent="center"
            alignItems="center"
            w="0px"
            ml="0px"
            overflow="hidden"
            opacity={0}
            transform="translateX(8px)"
            transition="all 200ms ease"
          >
            <RightIcon size={18} aria-hidden="true" />
          </Box>
        </Flex>
      </a>
    </Button>
  )
}
