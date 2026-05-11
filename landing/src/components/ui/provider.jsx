'use client'

import { ChakraProvider, defaultSystem, createSystem, defaultConfig} from '@chakra-ui/react'
import { ColorModeProvider } from './color-mode'

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        body: { value: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'" },
        heading: { value: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'" },
      },
    },
  },
})


export function Provider(props) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
