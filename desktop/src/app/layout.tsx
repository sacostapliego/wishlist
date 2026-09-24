import type { Metadata, Viewport } from 'next'
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

/**
 * viewport-fit=cover is what makes env(safe-area-inset-*) resolve to real values
 * on notched iPhones — without it the bottom nav cannot reserve room for the
 * home indicator, and its icons sit under it.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#141414',
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
