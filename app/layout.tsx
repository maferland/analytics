import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  description: 'Public operating metrics for Marc-Antoine Ferland’s projects.',
  metadataBase: new URL('https://analytics.maferland.com'),
  title: 'Analytics · maferland.com',
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
