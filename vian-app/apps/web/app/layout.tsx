import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'VIAN Studio',
    template: '%s | VIAN',
  },
  description: 'AI-powered app builder • Made with VIAN by Viren',
  keywords: ['AI code generator', 'Next.js generator', 'full-stack AI', 'VIAN', 'Viren Pandey', 'app builder'],
  authors: [{ name: 'Viren Pandeyy' }],
  creator: 'Viren Pandeyy',
  metadataBase: new URL('https://vian.dev'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vian.dev',
    siteName: 'VIAN',
    title: 'VIAN Studio',
    description: 'Made with VIAN by Viren Pandeyy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIAN Studio',
    description: 'AI-powered app builder • Made with VIAN by Viren',
    creator: '@virenpandey',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark bg-[#0d0d0d]">
      <body className="bg-[#0d0d0d] text-[#f0f0f0] antialiased">
        {children}
      </body>
    </html>
  )
}
