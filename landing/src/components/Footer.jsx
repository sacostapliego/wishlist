import { Box, HStack, VisuallyHidden } from '@chakra-ui/react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
  return (
    <Box
      as="footer"
      mt={16}
      w="100%"
      background="linear-gradient(to bottom, #141414, #1d1d1d)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={24}
    >
      <HStack gap={6} mt={-40}>
        <Box
          as="a"
          href="https://github.com/sacostapliego/"
          target="_blank"
          rel="noopener noreferrer"
          position="relative"
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="48px"
          w="48px"
          borderRadius="8px"
          color="gray.400"
          background="#1d1d1d"
          p={3}
          role="group"
          _hover={{
            '& .footer-icon': {
              transform: 'scale(1.18)',
              color: '#FAF9F6',
            },
          }}
        >
          <Box
            as={FaGithub}
            className="footer-icon"
            boxSize="40px"
            transition="transform .25s ease, color .25s ease"
            transformOrigin="50% 50%"
          />
          <VisuallyHidden>GitHub</VisuallyHidden>
        </Box>

        <Box
          as="a"
          href="https://www.linkedin.com/in/steven-acosta-pliego/"
          target="_blank"
          rel="noopener noreferrer"
          position="relative"
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="48px"
          w="48px"
          borderRadius="8px"
          color="gray.400"
          background="#1d1d1d"
          p={3}
          role="group"
          _hover={{
            '& .footer-icon': {
              transform: 'scale(1.18)',
              color: '#FAF9F6',
            },
          }}
        >
          <Box
            as={FaLinkedin}
            className="footer-icon"
            boxSize="40px"
            transition="transform .25s ease, color .25s ease"
            transformOrigin="50% 50%"
          />
          <VisuallyHidden>LinkedIn</VisuallyHidden>
        </Box>
      </HStack>
      <VisuallyHidden>Footer navigation</VisuallyHidden>
    </Box>
  );
}