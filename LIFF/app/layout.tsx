import { Inter } from 'next/font/google'
import './globals.css'
import { LiffProvider } from '@/components/LiffProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'IT Helpdesk LIFF App',
  description: 'Submit and track IT tickets via LINE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LiffProvider>
          {children}
        </LiffProvider>
      </body>
    </html>
  )
}