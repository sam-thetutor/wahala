import { Inter } from 'next/font/google'
import './globals.css'
import ContextProvider from '@/context'
import AccountModalProvider from '@/components/AccountModalProvider'
import { FarcasterProvider } from '@/components/FarcasterProvider'
import MiniAppWrapper from '@/components/MiniAppWrapper'
import AppKitProvider from '@/components/AppKitProvider'
import { cookies } from 'next/headers'
import ClientLayout from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Snarkels - Quiz Rewards',
  description: 'Create and participate in quiz sessions with crypto rewards',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png'
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get cookies for wagmi state persistence
  const cookieStore = await cookies()
  let cookieString: string | null = null
  
  try {
    // Get all cookies and convert to a proper format
    const allCookies = cookieStore.getAll()
    if (allCookies.length > 0) {
      // Convert cookies to a format that wagmi can understand
      cookieString = allCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
    }
  } catch (error) {
    console.warn('Error processing cookies:', error)
    cookieString = null
  }

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Farcaster Mini App Embed Meta Tags */}
        <meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://snarkels.vercel.app/api/og","button":{"title":"🎯 Start Quiz","action":{"type":"launch_miniapp","url":"https://snarkels.vercel.app","name":"Snarkels","splashImageUrl":"https://snarkels.vercel.app/logo.png","splashBackgroundColor":"#1f2937"}}}' />
        <meta name="fc:frame" content='{"version":"1","imageUrl":"https://snarkels.vercel.app/api/og","button":{"title":"🎯 Start Quiz","action":{"type":"launch_frame","url":"https://snarkels.vercel.app","name":"Snarkels","splashImageUrl":"https://snarkels.vercel.app/logo.png","splashBackgroundColor":"#1f2937"}}}' />
        
        {/* Mini App Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Social Media Meta Tags */}
        <meta property="og:title" content="Snarkels - Interactive Quiz Rewards" />
        <meta property="og:description" content="Create and participate in interactive quizzes with crypto rewards on Base and Celo networks" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://snarkels.lol" />
        <meta property="og:image" content="https://snarkels.lol/api/og" />
        
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Snarkels - Interactive Quiz Rewards" />
        <meta name="twitter:description" content="Create and participate in interactive quizzes with crypto rewards on Base and Celo networks" />
        <meta name="twitter:image" content="https://snarkels.lol/api/og" />
      </head>
      <body className={inter.className}>
        <ContextProvider cookies={cookieString}>
          <MiniAppWrapper>
            <FarcasterProvider>
              <AppKitProvider>
                <ClientLayout>
                  <AccountModalProvider>
                    {children}
                  </AccountModalProvider>
                </ClientLayout>
              </AppKitProvider>
            </FarcasterProvider>
          </MiniAppWrapper>
        </ContextProvider>
      </body>
    </html>
  )
}
