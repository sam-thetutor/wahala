'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

interface FarcasterContextType {
  isFarcasterApp: boolean
  isReady: boolean
  context: any
  shareApp: () => void
  showToast: (message: string) => void
  composeCast: (text: string, embeds?: [] | [string] | [string, string]) => void
  addToFarcaster: () => void
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined)

export function useFarcaster() {
  const context = useContext(FarcasterContext)
  if (!context) {
    throw new Error('useFarcaster must be used within a FarcasterProvider')
  }
  return context
}

interface FarcasterProviderProps {
  children: ReactNode
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isFarcasterApp, setIsFarcasterApp] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [context, setContext] = useState<any>(null)

  useEffect(() => {
    const detectFarcasterApp = async () => {
      try {
        // Use the proper SDK method to detect Mini App
        const isMini = await sdk.isInMiniApp()
        
        if (isMini) {
          setIsFarcasterApp(true)
          
          // Get the context information
          const sdkContext = sdk.context
          setContext(sdkContext)
          
          // Call ready() to hide the splash screen
          await sdk.actions.ready()
          setIsReady(true)
          
          console.log('Farcaster Mini App Context:', sdkContext)
        } else {
          setIsReady(true)
        }
      } catch (error) {
        console.error('Error detecting Farcaster app:', error)
        setIsReady(true)
      }
    }

    detectFarcasterApp()
  }, [])

  const addToFarcaster = async () => {
    if (isFarcasterApp) {
      try {
        await sdk.actions.addMiniApp()
        alert('App added to Farcaster!')
      } catch (error: any) {
        console.error('Error adding app to Farcaster:', error)
        if (error.message?.includes('RejectedByUser')) {
          alert('You cancelled adding the app to Farcaster')
        } else if (error.message?.includes('InvalidDomainManifestJson')) {
          alert('Cannot add app in development mode. Deploy to production first.')
        } else {
          alert('Failed to add app to Farcaster')
        }
      }
    }
  }

  const shareApp = async () => {
    if (isFarcasterApp) {
      try {
        await sdk.actions.composeCast({
          text: "🎯 Just discovered Snarkels - a quiz platform with crypto rewards! Join me in some brain-bending challenges!",
          embeds: ["https://snarkels.vercel.app"]
        })
      } catch (error) {
        console.error('Error sharing app:', error)
        alert('Failed to share app')
      }
    } else {
      // Fallback for non-Farcaster environments
      alert('Share feature available in Farcaster Mini App')
    }
  }

  const composeCast = async (text: string, embeds?: [] | [string] | [string, string]) => {
    if (isFarcasterApp) {
      try {
        const result = await sdk.actions.composeCast({
          text,
          embeds: embeds || []
        })
        
        if (result?.cast) {
          console.log('Cast posted successfully:', result.cast.hash)
          return result.cast
        } else {
          console.log('User cancelled cast')
        }
      } catch (error) {
        console.error('Error composing cast:', error)
        alert('Failed to compose cast')
      }
    } else {
      // Fallback for non-Farcaster environments
      alert('Cast feature available in Farcaster Mini App')
    }
  }

  const showToast = async (message: string) => {
    // Fallback to browser alert for now
    alert(message)
  }

  const value: FarcasterContextType = {
    isFarcasterApp,
    isReady,
    context,
    shareApp,
    showToast,
    composeCast,
    addToFarcaster,
  }

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  )
} 