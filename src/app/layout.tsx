import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Film Production OS',
  description: 'Modern film production management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
