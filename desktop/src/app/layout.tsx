import type { Metadata } from 'next'
import { Provider } from '@/components/ui/provider'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import '@/App.css'
import { Analytics } from '@vercel/analytics/next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cardinalwishlist.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Wishlist',
  description: 'View this wishlist',
  openGraph: {
    title: 'Wishlist',
    description: 'View this wishlist',
    images: ['/favicon.png'],
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body>
        <Provider>
          <AuthProvider>
            {children}
            <Toaster />
            <Analytics />
          </AuthProvider>
        </Provider>
      </body>
    </html>
  )
}
