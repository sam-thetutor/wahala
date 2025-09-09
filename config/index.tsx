import { cookieStorage, createStorage, http } from '@wagmi/core'
import { celo, base } from '@reown/appkit/networks'
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector"
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { Config } from 'wagmi'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { coinbaseWallet } from 'wagmi/connectors'

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "48f6c31f2547205456c0abfa1fe6d7e3"

if (!projectId) {
  throw new Error('Project ID is not defined in config')
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [celo, base] // Celo first for mainnet, then Base

// Create base wagmi config with Farcaster Mini App support
export const baseWagmiConfig = {
  chains: networks,
  connectors: [
    // Farcaster Mini App connector should be first for Mini App context
    farcasterFrame(),
    coinbaseWallet({
      appName: 'Zyn',
      appLogoUrl: 'https://zynp.vercel.app/logo.png',
      preference: 'all', // Supports both EOA and Smart Wallet
      version: '4' // Use latest version
    })
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [celo.id]: http('https://forno.celo.org'),
    [base.id]: http(),
  },
}

// Create Wagmi Adapter for AppKit
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

// Create AppKit instance with Farcaster Mini App support
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  defaultNetwork: celo,
  metadata: {
    name: 'Zyn',
    description: 'Zyn - Create and trade on prediction markets',
    url: 'https://zynp.vercel.app',
    icons: ['https://zynp.vercel.app/logo.png']
  },
  featuredWalletIds: [
    "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Farcaster first
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // Coinbase
    "d01c7758d741b363e637a817a09bcf579feae4db9f5bb16f599fdd1f66e2f974", // MetaMask
  ],
  features: {
    analytics: true,
    // Enable Farcaster social login first
    socials: [
      "farcaster", // Farcaster first for Mini App context
      "google",
      "x", 
      "github",
      "discord",
      "apple",
      "facebook",
    ],
    email: true,
    emailShowWallets: false, // Disable email wallets in Mini App context
  },
  // Show all wallets but prioritize Farcaster
  allWallets: "SHOW",
  // Set theme to white
  themeMode: "light"
})

// Export the wagmi config for direct use
export const wagmiConfig: Config = wagmiAdapter.wagmiConfig as Config 