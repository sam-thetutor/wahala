'use client'

import { wagmiAdapter } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { base, celo, celoAlfajores } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'Snarkels',
  description: 'Snarkels - Create and host interactive quizzes',
  url: 'https://snarkels.vercel.app', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [base, celo], // Base first, then Celo
  defaultNetwork: base, // Set Base as default network
  metadata: metadata,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  let initialState = undefined
  
  try {
    if (cookies) {
      initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)
    }
  } catch (error) {
    console.warn('Error parsing cookies for wagmi state:', error)
    // Continue without initial state if cookie parsing fails
  }

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider 