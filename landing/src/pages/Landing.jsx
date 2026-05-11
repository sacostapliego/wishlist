import { Box, Container, HStack, Text, VStack, Image } from '@chakra-ui/react';
import HoverArrowButton from '../components/ui/HoverArrowButton';
import { FaSafari } from 'react-icons/fa';
import FeaturesSection from '../components/sections/FeaturesSection';
import photo1 from '../assets/screenshots/1.png';
import photo2 from '../assets/screenshots/2.png';
import photo3 from '../assets/screenshots/3.png';

import newphoto1 from '../assets/screenshots/1-portrait.png';
import newphoto2 from '../assets/screenshots/2-portrait.png';
import newphoto3 from '../assets/screenshots/3-portrait.png';

const wishlistUrl = 'https://cardinalwishlist.vercel.app/';

export default function Landing() {
  return (
    <VStack align="start" spacing={12} pt={8}>
      <Container 
        id="hero"
        display="flex"
        flexDirection="column"
        alignItems="center"
        textAlign="center"
      >
        <Text mb={14} fontSize={{ base: "4xl", md: "6xl" }} fontWeight="bold">
          A modern way to create, share, and manage your wishlist
        </Text>

        <HoverArrowButton
          href={wishlistUrl}
          bg="#C41E3A"
          color="white"
          px={6}
          py={8}
          borderRadius="16px"
          leftIcon={FaSafari}
          mb={16}
        >
          Go To Wishlist App
        </HoverArrowButton>

        <HStack justify="center" gap={0} w="full" flex={1}>
          <Image 
            h={{base: "1xl", md: "3xl"}}
            src={newphoto2}
            display={{ base: 'none', md: 'block' }}
          />
          <Image 
            h={{base: "2xl", md: "4xl"}}
            src={newphoto1}
          />
          <Image 
            h={{base: "1xl", md: "3xl"}}
            src={newphoto3}
            display={{ base: 'none', md: 'block' }}
          />
        </HStack>
        <Box h="5vh" />
      </Container>

      <Container id="features" w="container.sm">
        <FeaturesSection />
      </Container>

      <Container id='link-to-app' maxW="container.sm" textAlign="center">
        <HoverArrowButton
            href={wishlistUrl}
            bg="#C41E3A"
            color="white"
            px={6}
            py={8}
            borderRadius="16px"
            leftIcon={FaSafari}
            mb={16}
          >
            Go To Wishlist App
          </HoverArrowButton>
      </Container>
    </VStack>
  );
}
