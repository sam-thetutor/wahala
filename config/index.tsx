import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, base } from '@reown/appkit/networks'
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector"
import { metaMask, injected } from 'wagmi/connectors'
import type { Config } from 'wagmi'

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined in config')
}

export const networks = [celo, base]

// Base connectors that work in both server and client
const baseConnectors = [
  injected(),
  farcasterFrame(),
  metaMask({
    dappMetadata: {
      name: "Snarkels",
      url: "https://snarkels.vercel.app",
    }
  })
]

// Create the base wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  connectors: baseConnectors,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [celo.id]: http(),
    [base.id]: http(),
  },
})

// Function to get enhanced adapter with walletConnect on client side
export const getEnhancedAdapter = async (): Promise<WagmiAdapter> => {
  if (typeof window === 'undefined') {
    return wagmiAdapter
  }

  try {
    const { walletConnect } = await import('wagmi/connectors')
    
    const enhancedConnectors = [
      ...baseConnectors,
      walletConnect({
        projectId,
        metadata: {
          name: 'Snarkels',
          description: 'Snarkels - Create and host interactive quizzes',
          url: 'https://snarkels.vercel.app',
          icons: ['https://avatars.githubusercontent.com/u/179229932']
        },
        showQrModal: true,
      })
    ]

    return new WagmiAdapter({
      projectId,
      networks,
      connectors: enhancedConnectors,
      storage: createStorage({
        storage: cookieStorage,
      }),
      transports: {
        [celo.id]: http(),
        [base.id]: http(),
      },
    })
  } catch (error) {
    console.warn('Failed to load walletConnect connector:', error)
    return wagmiAdapter
  }
}

// Export the wagmi config for direct use
export const wagmiConfig: Config = wagmiAdapter.wagmiConfig as Config 