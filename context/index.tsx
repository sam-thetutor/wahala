'use client'

import { getEnhancedAdapter } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { base, celo, celoAlfajores } from '@reown/appkit/networks'
import React, { type ReactNode, useEffect, useState } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "48f6c31f2547205456c0abfa1fe6d7e3"

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'Snarkels',
  description: 'Snarkels - Create and host interactive quizzes',
  url: 'https://snarkels.lol', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const [adapter, setAdapter] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAdapter = async () => {
      try {
        const enhancedAdapter = await getEnhancedAdapter()
        setAdapter(enhancedAdapter)
      } catch (error) {
        console.error('Failed to load enhanced adapter:', error)
        // Fallback to base adapter if enhanced fails
        const { wagmiAdapter } = await import('@/config')
        setAdapter(wagmiAdapter)
      } finally {
        setIsLoading(false)
      }
    }

    loadAdapter()
  }, [])

  // Create the modal with the loaded adapter
  const modal = adapter ? createAppKit({
    adapters: [adapter],
    projectId,
    networks: [base, celo], // Base first, then Celo
    defaultNetwork: base, // Set Base as default network
    metadata: metadata,
    features: {
      analytics: true // Optional - defaults to your Cloud configuration
    }
  }) : null

  let initialState = undefined
  
  try {
    if (cookies && adapter) {
      initialState = cookieToInitialState(adapter.wagmiConfig as Config, cookies)
    }
  } catch (error) {
    console.warn('Error parsing cookies for wagmi state:', error)
    // Continue without initial state if cookie parsing fails
  }

  if (isLoading || !adapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <WagmiProvider config={adapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider 