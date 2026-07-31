import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegistration from './ServiceWorkerRegistration'

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
    <html lang="en">
      <body className="antialiased">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
