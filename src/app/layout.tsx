import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Linkodo',
  description: 'Transform your content with intelligent linking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}