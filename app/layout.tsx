import type { Metadata, Viewport } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Digital Passport — Your Home. Secured.',
  description: 'The luxury home management system for discerning homeowners. Complete service history, secure document vault, and automated warranty tracking.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Digital Passport',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'Digital Passport',
    description: 'Your Home. Secured.',
    siteName: 'Digital Passport',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D0D0D',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Preload the explainer video so it’s ready when VideoSplash mounts */}
        <link rel="preload" as="video" href="/explainer.mp4" type="video/mp4" />
        {/* Inline critical CSS: prevent white FOUC before Tailwind stylesheet loads */}
        <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#0D0D0D;margin:0}' }} />
      </head>
      <body className={`${spaceGrotesk.variable} font-sans bg-vault-bg text-vault-text antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
