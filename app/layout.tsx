import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Timestamp Converter',
  description: 'Created with Next.js',
  generator: 'Super Dev',
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
