import { Button, Box, Flex, Text } from '@chakra-ui/react';
import { FaSafari } from 'react-icons/fa';
import { FaArrowRight } from 'react-icons/fa6';

export default function HoverArrowButton({
  href,
  children = 'Go To Wishlist App',
  leftIcon: LeftIcon = FaSafari,
  rightIcon: RightIcon = FaArrowRight,
  bg = '#C41E3A',
  color = 'white',
  px = 8,
  py = 6,
  borderRadius = '16px',
  ...props
}) {
  return (
    <Button
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
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
      <Flex as="span" align="center">
        {/* Left icon */}
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

        {/* Text */}
        <Text className="cta-text" whiteSpace="nowrap">
          {children}
        </Text>

        {/* Right arrow (appears next to text) */}
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
    </Button>
  );
}