import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/optimistic.css'
import ContextProvider from '@/context'
import AccountModalProvider from '@/components/AccountModalProvider'
import { FarcasterProvider } from '@/components/FarcasterProvider'
import MiniAppWrapper from '@/components/MiniAppWrapper'
import AppKitProvider from '@/components/AppKitProvider'
// ReferralProvider removed - using Divvi SDK instead
import { cookies } from 'next/headers'
import ClientLayout from '@/components/ClientLayout'
import TopNavbar from '@/components/TopNavbar'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

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
        <title>Zyn - Prediction Markets</title>
        <meta name="description" content="Decentralized prediction markets on Celo. Create, trade, and win with YES/NO shares on any question." />
        
        {/* Farcaster Mini App Embed Meta Tags */}
        <meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://zynp.vercel.app/logo.png","button":{"title":"🎯 Predict with Zyn","action":{"type":"launch_miniapp","url":"https://zynp.vercel.app","name":"Zyn","splashImageUrl":"https://zynp.vercel.app/logo.png","splashBackgroundColor":"#1f2937"}}}' />
        <meta name="fc:frame" content='{"version":"1","imageUrl":"https://zynp.vercel.app/logo.png","button":{"title":"🎯 Predict with Zyn","action":{"type":"launch_frame","url":"https://zynp.vercel.app","name":"Zyn","splashImageUrl":"https://zynp.vercel.app/logo.png","splashBackgroundColor":"#1f2937"}}}' />
        
        {/* Mini App Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Social Media Meta Tags */}
        <meta property="og:title" content="Zyn - Prediction Markets" />
        <meta property="og:description" content="Decentralized prediction markets on Celo. Create, trade, and win with YES/NO shares on any question." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://zynp.vercel.app" />
        <meta property="og:image" content="https://zynp.vercel.app/logo.png" />
        
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Zyn - Prediction Markets" />
        <meta name="twitter:description" content="Decentralized prediction markets on Celo. Create, trade, and win with YES/NO shares on any question." />
        <meta name="twitter:image" content="https://zynp.vercel.app/logo.png" />
      </head>
      <body className={inter.className}>
        <ContextProvider cookies={cookieString}>
          <MiniAppWrapper>
            <FarcasterProvider>
              <AppKitProvider>
                <ClientLayout>
                  <AccountModalProvider>
                    <ErrorBoundary>
                      <TopNavbar />
                      {children}
                    </ErrorBoundary>
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
