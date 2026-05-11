import { Container, Heading, Text, VStack } from '@chakra-ui/react';
import FeaturesSection from '../components/sections/FeaturesSection';
import { FaReact, FaLock, FaBolt, FaCloud, FaHeart, FaList, FaShareAlt, FaSync } from 'react-icons/fa';
import { SiTypescript, SiExpo, SiRender } from "react-icons/si";


const defaultFeatures = [
  { icon: SiTypescript, label: 'Type\nSafety' },
  { icon: FaReact, label: 'Modern\nUI' },
  { icon: SiExpo, label: 'Cross\nPlatform' },
  { icon: SiRender, label: 'Web\nDeployment' },
];

export default function Frontend() {
  return (
    <VStack align="start" spacing={12} pt={8} minH={"100vh"}> 
      <Container 
        id="hero"
        maxW="container.lg"
        display="flex"
        flexDirection="column"
        alignItems="center"
        textAlign="center"
      >
        <Text mb={14} fontSize="xl" fontWeight="bold">
          {/* [IMAGE OF FRONEND ARCHITECTURE DIAGRAM HERE] */}
        </Text>
      </Container>
      <FeaturesSection features={defaultFeatures} />
    </VStack>
  );
}