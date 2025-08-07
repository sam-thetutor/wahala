'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import ContextProvider from '@/context'
import { FarcasterProvider, useFarcaster } from '@/components/FarcasterProvider'

const inter = Inter({ subsets: ['latin'] })

function AppContent({ children }: { children: React.ReactNode }) {
  const { isFarcasterApp, context } = useFarcaster()

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100"
      style={{
        paddingTop: isFarcasterApp ? (context?.client?.safeAreaInsets?.top ?? 0) : 0,
        paddingBottom: isFarcasterApp ? (context?.client?.safeAreaInsets?.bottom ?? 0) : 0,
        paddingLeft: isFarcasterApp ? (context?.client?.safeAreaInsets?.left ?? 0) : 0,
        paddingRight: isFarcasterApp ? (context?.client?.safeAreaInsets?.right ?? 0) : 0,
      }}
    >
      {children}
    </div>
  )
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Snarkels - Quiz Rewards</title>
        <meta name="description" content="Create and participate in quiz sessions with crypto rewards" />
        
        {/* Farcaster Mini App Embed Meta Tags */}
        <meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://snarkels.vercel.app/api/og","button":{"title":"🎯 Start Quiz","action":{"type":"launch_miniapp","url":"https://snarkels.vercel.app","name":"Snarkels","splashImageUrl":"https://snarkels.vercel.app/logo.png","splashBackgroundColor":"#1f2937"}}}' />
        <meta name="fc:frame" content='{"version":"1","imageUrl":"https://snarkels.vercel.app/api/og","button":{"title":"🎯 Start Quiz","action":{"type":"launch_frame","url":"https://snarkels.vercel.app","name":"Snarkels","splashImageUrl":"https://snarkels.vercel.app/logo.png","splashBackgroundColor":"#1f2937"}}}' />
      </head>
      <body className={inter.className}>
        <ContextProvider cookies={null}>
          <FarcasterProvider>
            <AppContent>
              {children}
            </AppContent>
          </FarcasterProvider>
        </ContextProvider>
      </body>
    </html>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LayoutContent>{children}</LayoutContent>
}
