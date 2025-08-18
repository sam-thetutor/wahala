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
  callReady: () => Promise<void> // Add manual ready function
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
          
          console.log('Farcaster Mini App Context:', sdkContext)
          
          // Call ready() to hide the splash screen with retry logic
          let readyCalled = false
          let retryCount = 0
          const maxRetries = 3
          
          const callReady = async () => {
            try {
              if (!readyCalled && retryCount < maxRetries) {
                retryCount++
                console.log(`Attempting to call sdk.actions.ready() (attempt ${retryCount})`)
                
                await sdk.actions.ready()
                readyCalled = true
                console.log('Successfully called sdk.actions.ready() - splash screen should be hidden')
                setIsReady(true)
              }
            } catch (error) {
              console.error(`Error calling sdk.actions.ready() (attempt ${retryCount}):`, error)
              
              if (retryCount < maxRetries) {
                // Retry after a short delay
                setTimeout(callReady, 500)
              } else {
                console.error('Failed to call sdk.actions.ready() after all retries')
                setIsReady(true) // Set ready anyway to prevent blocking
              }
            }
          }
          
          // Call ready immediately
          await callReady()
          
          // Also set a fallback timeout to ensure ready is called
          setTimeout(() => {
            if (!readyCalled) {
              console.log('Fallback: calling sdk.actions.ready() after timeout')
              callReady()
            }
          }, 1000)
          
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
          embeds: ["https://snarkels.lol"]
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

  const callReady = async () => {
    try {
      await sdk.actions.ready()
      setIsReady(true)
      console.log('Successfully called sdk.actions.ready() - splash screen should be hidden')
    } catch (error) {
      console.error('Failed to call sdk.actions.ready() manually:', error)
    }
  }

  const value: FarcasterContextType = {
    isFarcasterApp,
    isReady,
    context,
    shareApp,
    showToast,
    composeCast,
    addToFarcaster,
    callReady,
  }

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  )
} 