import type { Metadata, Viewport } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegistration from './ServiceWorkerRegistration'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Cary's Bookshelf",
  description: 'Track the books in our home library',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Bookshelf',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#2A4365',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased bg-parchment text-ink font-sans min-h-screen">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
