import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Analytics · maferland.com',
  description: 'Public operating metrics for Marc-Antoine Ferland’s projects.',
  metadataBase: new URL('https://analytics.maferland.com'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Analytics · maferland.com',
    description:
      'Public operating metrics for Marc-Antoine Ferland’s projects.',
    url: '/',
    siteName: 'maferland.com',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Analytics · maferland.com',
    description:
      'Public operating metrics for Marc-Antoine Ferland’s projects.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
