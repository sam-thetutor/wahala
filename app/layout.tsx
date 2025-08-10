import { Inter } from 'next/font/google'
import './globals.css'
import ContextProvider from '@/context'
import AccountModalProvider from '@/components/AccountModalProvider'
import { FarcasterProvider } from '@/components/FarcasterProvider'
import { cookies } from 'next/headers'
import ClientLayout from '@/components/ClientLayout'

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
        <title>Snarkels - Quiz Rewards</title>
        <meta name="description" content="Create and participate in quiz sessions with crypto rewards" />
        
        {/* Farcaster Mini App Embed Meta Tags */}
        <meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://snarkels.vercel.app/api/og","button":{"title":"🎯 Start Quiz","action":{"type":"launch_miniapp","url":"https://snarkels.vercel.app","name":"Snarkels","splashImageUrl":"https://snarkels.vercel.app/logo.png","splashBackgroundColor":"#1f2937"}}}' />
        <meta name="fc:frame" content='{"version":"1","imageUrl":"https://snarkels.vercel.app/api/og","button":{"title":"🎯 Start Quiz","action":{"type":"launch_frame","url":"https://snarkels.vercel.app","name":"Snarkels","splashImageUrl":"https://snarkels.vercel.app/logo.png","splashBackgroundColor":"#1f2937"}}}' />
      </head>
      <body className={inter.className}>
        <ContextProvider cookies={cookieString}>
          <FarcasterProvider>
            <ClientLayout>
              <AccountModalProvider>
                {children}
              </AccountModalProvider>
            </ClientLayout>
          </FarcasterProvider>
        </ContextProvider>
      </body>
    </html>
  )
}
