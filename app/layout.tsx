import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'blart.ai — AI Art Gallery',
  description: 'Beautiful AI-generated digital artworks, delivered daily.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
