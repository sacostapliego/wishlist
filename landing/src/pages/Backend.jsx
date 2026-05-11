import { Container, Heading, Image, Text, VStack } from '@chakra-ui/react';
import FeaturesSection from '../components/sections/FeaturesSection';
import { FaPython, FaAws } from "react-icons/fa";
import { SiTypescript, SiExpo, SiRender } from "react-icons/si";
import { RiSupabaseFill } from "react-icons/ri";
import FAQSection from '../components/sections/FAQSection';
import { faqData } from '../data/faqData';
import backendImage from '../assets/drawings/backend-fastapi.png';


const defaultFeatures = [
  { icon: RiSupabaseFill, label: 'Database\nIntegration' },
  { icon: FaAws, label: 'Image\nHandling' },
  { icon: SiRender, label: 'API\nDeployment' },
];

export default function Backend() {
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
          <Image 
          src={backendImage} 
          alt="Backend Illustration" 
          borderRadius={16} 
          boxShadow="md"
          />
        </Text>
      </Container>
      <FAQSection faqs={faqData} />
      <FeaturesSection features={defaultFeatures} columns={{ base: 3, md: 3 }} />
    </VStack>
  );
}