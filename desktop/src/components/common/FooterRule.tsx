import { Box } from '@chakra-ui/react'

/** Hairline between two footer facts — the quiet version of a " | ". */
export function FooterRule() {
  return <Box w="1px" h="0.7rem" flexShrink={0} bg="rgba(255,255,255,0.18)" />
}

export default FooterRule
