import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Flex,
  HStack,
  Button,
  IconButton,
  Link as ChakraLink,
  useDisclosure,
  Stack,
  Text,
  Drawer,
  Image,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom'
import { GiHamburgerMenu } from "react-icons/gi";
import { FaGear, FaCode} from "react-icons/fa6";
import { FaSafari } from "react-icons/fa";
import HoverArrowButton from '../components/ui/HoverArrowButton';
import HoverSwapLogo from '../components/ui/HoverSwapLogo';

import icon from '../assets/icons/icon.png';

const navLinks = [
    { label: 'Frontend', to: '/frontend', icon: FaCode },
    { label: 'Backend', to: '/backend', icon: FaGear },
  ];

export default function Header({ brand = 'BluJays Wishlist', transparentUntil = '#hero', wishlistUrl }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    // replace old isTransparent state
    const [scrolled, setScrolled] = useState(false);
    const [overHero, setOverHero] = useState(false);
    const headerRef = useRef(null);
  
    useEffect(() => {
      const update = () => {
        const headerH = headerRef.current?.offsetHeight ?? 64;
        const el = document.querySelector(transparentUntil);
  
        setScrolled(window.scrollY > 0);
  
        if (!el) {
          setOverHero(false);
          return;
        }
  
        const rect = el.getBoundingClientRect();
        // header is over hero while hero's bottom is below header height
        setOverHero(rect.bottom > headerH);
      };
  
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    }, [transparentUntil]);
  
    const solidBg = '#141414';
    const blurBg = 'rgba(20,20,20,0.55)';
  
    const isBlur = scrolled && overHero;
    const bg = isBlur ? blurBg : solidBg;
    const backdrop = isBlur ? 'saturate(180%) blur(10px)' : 'none';
  
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
          sx={{
            'button:focus, a:focus': { outline: 'none', boxShadow: 'none' },
          }}
        >
          <Flex
            as="nav"
            mx="auto"
            w="100%"
            maxW="7xl"
            px={{ base: 4, md: 6 }}
            h="96px"
            align="center"
            justify="space-between"
          >
        {/* Left: Brand */}
        <HStack spacing={3}>
          <HoverSwapLogo
            to="/"
            imgSrc={icon}
            imgAlt="BluJays Wishlist logo"
            text={brand}
            boxSize="42px"
            borderRadius="8px"
            borderColor="white"
            borderWidth="2px"
            p={1}
          />
        </HStack>


        {/* Right: Desktop nav */}
        <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
          {navLinks.map((l) => {
            const Icon = l.icon;
            return (
              <Button
                key={l.label}
                as={RouterLink}
                to={l.to}
                variant="ghost"
                size="lg"
                fontWeight="semibold"
                borderRadius={'8px'}
                _hover={{ '& .nav-icon': { transform: 'rotate(-15deg)' } }}
              >
                <HStack spacing={2}>
                  <Box
                    as={Icon}
                    className="nav-icon"
                    fontSize="lg"
                    transition="transform 200ms ease"
                    willChange="transform"
                  />
                  <Text>{l.label}</Text>
                </HStack>
              </Button>
            );
          })}
          <HStack spacing={2} pl={2}>
            <HoverArrowButton
              href={wishlistUrl}
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

        {/* Chakra Drawer */}
        <Drawer.Root placement="right" open={isOpen} onOpenChange={(e) => (e.open ? onOpen() : onClose())}>
          <Drawer.Trigger asChild>
            <IconButton
              variant="ghost"
              display={{ base: 'inline-flex', md: 'none' }}
              colorPalette="white"
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
                <Stack spacing={2} pt={2}>
                  {navLinks.map((l) => {
                    const Icon = l.icon;
                    return (
                      <Button
                        key={l.label}
                        as={RouterLink}
                        to={l.to}
                        variant="ghost"
                        justifyContent="flex-start"
                        onClick={onClose}
                        role="group"
                      >
                        <HStack spacing={2}>
                          <Box
                            as={Icon}
                            fontSize="lg"
                            transition="transform 200ms ease"
                            willChange="transform"
                            _groupHover={{ transform: 'rotate(-15deg)' }}
                          />
                          <Text>{l.label}</Text>
                        </HStack>
                      </Button>
                    );
                  })}
                  <Button as="a" href={wishlistUrl} colorScheme="blue" onClick={onClose}>
                    Get started
                  </Button>
                </Stack>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Drawer.Root>
      </Flex>
    </Box>
  );
}