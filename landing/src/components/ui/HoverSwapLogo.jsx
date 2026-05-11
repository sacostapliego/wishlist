import { Link as ChakraLink, Box, Text, Image } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';

export default function HoverSwapLogo({
  to,
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
  ...props
}) {
  const As = href ? 'a' : RouterLink;
  const linkProps = href ? { href } : { to };

  return (
    <ChakraLink
      as={As}
      {...linkProps}
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
      {...props}
    >
      {/* Fixed-size bordered box; only contents animate */}
      <Box
        position="relative"
        w={boxSize}
        h={boxSize}
        borderRadius={borderRadius}
        borderWidth={borderWidth}
        borderColor={borderColor}
        p={p}
        mr={gap}
        overflow="hidden"
        flex="0 0 auto"
      >
        {/* Image (slides/fades left) */}
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

        {/* Right arrow (fades/slides in) */}
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

      {/* Text stays fixed; no layout shift */}
      <Text fontWeight="semibold" letterSpacing="-0.02em" fontSize="x-large">
        {text}
      </Text>
    </ChakraLink>
  );
}