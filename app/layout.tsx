import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import NativeInit from '@/components/NativeInit'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VitalMind — Your Wellness Companion',
  description: 'AI-powered mental, physical, and emotional wellness. Never feel alone.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#22c55e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VitalMind" />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <NativeInit />
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})`
        }} />
      </body>
    </html>
  )
}
