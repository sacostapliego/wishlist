import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom'
import Header from './Header';
import Footer from './Footer';

const wishlistUrl = 'https://cardinal-wishlist.onrender.com/';

export default function Layout() {
  return (
    <Box bg="#141414" minH="100vh">
      <Header brand="Cardinal Wishlist" transparentUntil="#hero" wishlistUrl={wishlistUrl} />
      <Box as="main" maxW="7xl" mx="auto" px={{ base: 4, md: 6 }} color="whiteAlpha.900">
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}