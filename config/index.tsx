import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, celoAlfajores } from '@reown/appkit/networks'
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector"
import { metaMask, walletConnect, injected } from 'wagmi/connectors'

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined in config')
}

export const networks = [celo, celoAlfajores]

// Set up the Wagmi Adapter (Config) with custom connectors
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks,
  connectors: [
    injected(),
    farcasterFrame(),
    metaMask({
      dappMetadata: {
        name: "Snarkels",
        url: "https://snarkels.vercel.app",
      }
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",
    }),
  ]
})

export const config = wagmiAdapter.wagmiConfig 