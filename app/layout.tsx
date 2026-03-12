import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FleetBrain AI',
  description: 'Smarter load decisions for owner-operators and small fleets.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0b0b0b] text-white antialiased">{children}</body>
    </html>
  )
}
