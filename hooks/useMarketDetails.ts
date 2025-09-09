import { useState, useEffect, useCallback, useRef } from 'react'
import { useAllMarketsApi } from './useMarketsApi'
import { useSmartPolling } from './useSmartPolling'

interface MarketData {
  id: string
  question: string
  totalpool: string
  totalyes: string
  totalno: string
  endtime: string
  status: string
  description?: string
  category?: string
  image?: string
  source?: string
  createdat?: string
  creator?: string
  outcome?: boolean
  isEnded?: boolean
  participants: any[]
}

interface UseMarketDetailsOptions {
  marketId: string
  enabled?: boolean
  pollingInterval?: number
}

export const useMarketDetails = ({ 
  marketId, 
  enabled = true, 
  pollingInterval = 3000 
}: UseMarketDetailsOptions) => {
  const [market, setMarket] = useState<MarketData | null>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [participantsLoading, setParticipantsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasUpdates, setHasUpdates] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [participantsRetryCount, setParticipantsRetryCount] = useState(0)
  
  // Get all markets data (already fetched)
  const { allMarkets, loading: marketsLoading } = useAllMarketsApi()
  
  // Use refs to store current values for comparison
  const marketRef = useRef<MarketData | null>(null)
  const participantsRef = useRef<any[]>([])

  // Find market from already-fetched markets list
  const findMarketFromList = useCallback((): MarketData | null => {
    if (!marketId || !allMarkets || allMarkets.length === 0) return null
    
    const foundMarket = allMarkets.find(m => m.id === marketId)
    if (foundMarket) {
      console.log('✅ Found market in cached list:', foundMarket)
      return {
        id: foundMarket.id,
        question: foundMarket.question,
        endtime: foundMarket.endtime,
        totalpool: foundMarket.totalpool,
        totalyes: foundMarket.totalyes,
        totalno: foundMarket.totalno,
        status: foundMarket.status.toString(), // Convert status to string
        outcome: foundMarket.outcome,
        createdat: foundMarket.createdat,
        creator: foundMarket.creator,
        description: foundMarket.description,
        category: foundMarket.category,
        image: foundMarket.image,
        source: foundMarket.source,
        participants: [] // Will be fetched separately
      }
    }
    return null
  }, [marketId, allMarkets])

  // Fetch participants data from API
  const fetchParticipants = useCallback(async (isBackground = false) => {
    if (!marketId) return

    // Skip participants fetch if we've retried too many times
    if (isBackground && participantsRetryCount >= 3) {
      console.log('⚠️ Skipping participants fetch - too many retries')
      return
    }

    // Set loading state for initial fetch
    if (!isBackground) {
      setParticipantsLoading(true)
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      if (isBackground) {
        console.log('🔄 Background refresh: Fetching participants for market:', marketId)
      } else {
        console.log('👥 Initial fetch: Participants for market:', marketId)
      }
      
      const response = await fetch(`/api/markets/${marketId}/participants`, {
        signal: controller.signal
      })
      
      // Clear timeout on successful response
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        // If participants endpoint doesn't exist, set empty array and don't retry
        if (response.status === 404) {
          console.log('⚠️ Participants endpoint not found, using empty array')
          setParticipants([])
          participantsRef.current = []
          return
        }
        
        // Get more specific error information
        let errorMessage = 'Failed to fetch participants'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        console.error('❌ Participants fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        })
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      const newParticipants = data.participants || []
      
      // Reset retry count on success
      setParticipantsRetryCount(0)
      
      // Only update if data has actually changed
      if (isBackground && participantsRef.current.length > 0) {
        const hasChanges = JSON.stringify(newParticipants) !== JSON.stringify(participantsRef.current)
        if (hasChanges) {
          console.log('🔄 Participants data changed, updating UI')
          setHasUpdates(true)
          setParticipants(newParticipants)
          participantsRef.current = newParticipants
          setLastUpdated(new Date())
          // Clear update indicator after 2 seconds
          setTimeout(() => setHasUpdates(false), 2000)
        } else {
          console.log('✅ No changes in participants data')
        }
      } else {
        setParticipants(newParticipants)
        participantsRef.current = newParticipants
        setLastUpdated(new Date())
        console.log('✅ Participants updated:', newParticipants.length, 'participants')
      }
      
      setError(null)
      setParticipantsLoading(false) // Set participants loading to false on success
    } catch (err) {
      // Clear timeout on error
      clearTimeout(timeoutId)
      
      console.error('❌ Error fetching participants:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        marketId,
        isBackground,
        retryCount: participantsRetryCount,
        isAborted: err instanceof Error && err.name === 'AbortError'
      })
      
      // Increment retry count
      setParticipantsRetryCount(prev => prev + 1)
      
      // Don't set error for participants, just use empty array
      setParticipants([])
      participantsRef.current = []
      setParticipantsLoading(false) // Set participants loading to false on error
      
      // If this is a background refresh and we haven't exceeded retry limit, schedule a retry
      if (isBackground && participantsRetryCount < 3) {
        const retryDelay = Math.min(1000 * Math.pow(2, participantsRetryCount), 10000) // Exponential backoff, max 10s
        console.log(`🔄 Scheduling participants retry in ${retryDelay}ms`)
        setTimeout(() => {
          fetchParticipants(true)
        }, retryDelay)
      } else if (!isBackground) {
        // For initial load, try to use DatabaseService as fallback
        console.log('🔄 Attempting fallback to DatabaseService for participants')
        try {
          const { DatabaseService } = await import('@/lib/database')
          const fallbackParticipants = await DatabaseService.getMarketParticipants(marketId)
          setParticipants(fallbackParticipants)
          participantsRef.current = fallbackParticipants
          setParticipantsLoading(false)
          console.log('✅ Fallback participants loaded:', fallbackParticipants.length)
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError)
        }
      }
    }
  }, [marketId, participantsRetryCount])

  // Fetch fresh market data from API (for updates)
  const fetchMarketData = useCallback(async (isBackground = false) => {
    if (!marketId) return

    try {
      if (isBackground) {
        console.log('🔄 Background refresh: Fetching fresh market data for:', marketId)
        setIsRefreshing(true)
      } else {
        console.log('📊 API fetch: Fresh market data for:', marketId)
      }
      
      const response = await fetch(`/api/markets/${marketId}`)
      if (!response.ok) throw new Error('Failed to fetch market')
      
      const data = await response.json()
      const newMarket = {
        ...data.market,
        status: data.market.status.toString(), // Convert status to string
        participants: [] // Initialize with empty participants
      }
      
      // Only update if data has actually changed
      if (isBackground && marketRef.current) {
        const hasChanges = JSON.stringify(newMarket) !== JSON.stringify(marketRef.current)
        if (hasChanges) {
          console.log('🔄 Market data changed, updating UI')
          setHasUpdates(true)
          setMarket(newMarket)
          marketRef.current = newMarket
          setLastUpdated(new Date())
          // Clear update indicator after 2 seconds
          setTimeout(() => setHasUpdates(false), 2000)
        } else {
          console.log('✅ No changes in market data')
        }
      } else {
        setMarket(newMarket)
        marketRef.current = newMarket
        setLastUpdated(new Date())
        console.log('✅ Market data updated:', newMarket)
      }
      
      setError(null)
    } catch (err) {
      console.error('❌ Error fetching market data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    } finally {
      if (isBackground) {
        setIsRefreshing(false)
      }
    }
  }, [marketId])

  // Initial load: Try to get market from cached list first
  useEffect(() => {
    if (!marketId || initialLoadComplete) return

    console.log('🔄 Initial load: Looking for market in cached list...', { 
      marketId, 
      allMarketsLength: allMarkets?.length || 0,
      marketsLoading 
    })
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ Initial load timeout - forcing completion')
      setInitialLoadComplete(true)
      setLoading(false)
    }, 10000) // 10 second timeout
    
    // First, try to get market from cached list
    const cachedMarket = findMarketFromList()
    if (cachedMarket) {
      console.log('✅ Using cached market data')
      clearTimeout(timeout)
      setMarket(cachedMarket)
      marketRef.current = cachedMarket
      setLoading(false)
      setInitialLoadComplete(true)
      
      // Fetch participants separately (don't wait for it)
      fetchParticipants(false).catch(() => {
        // Ignore participants errors
      })
    } else {
      // If not in cache, fetch from API immediately (don't wait for marketsLoading)
      console.log('❌ Market not found in cache, fetching from API...')
      Promise.all([
        fetchMarketData(false),
        fetchParticipants(false).catch(() => {
          // Ignore participants errors
        })
      ]).then(() => {
        clearTimeout(timeout)
        setInitialLoadComplete(true)
      }).catch((error) => {
        console.error('❌ Error fetching market data:', error)
        clearTimeout(timeout)
        setInitialLoadComplete(true) // Set to true even on error to prevent infinite loading
      })
    }
    
    return () => clearTimeout(timeout)
  }, [marketId, findMarketFromList, initialLoadComplete, fetchMarketData, fetchParticipants])

  // Background refresh function (for polling)
  const backgroundRefresh = useCallback(async () => {
    console.log('🔄 Background refresh triggered')
    try {
      await Promise.all([
        fetchMarketData(true),
        fetchParticipants(true).catch((err) => {
          console.log('⚠️ Participants fetch failed in background refresh:', err)
          // Don't throw, just log the error
        })
      ])
    } catch (error) {
      console.error('❌ Background refresh error:', error)
    }
  }, [fetchMarketData, fetchParticipants])

  // Manual refresh function
  const refreshData = useCallback(async () => {
    console.log('🔄 Manual refresh called')
    setLoading(true)
    try {
      await Promise.all([
        fetchMarketData(false),
        fetchParticipants(false).catch((err) => {
          console.log('⚠️ Participants fetch failed in manual refresh:', err)
          // Don't throw, just log the error
        })
      ])
      console.log('✅ Manual refresh completed successfully')
    } catch (error) {
      console.error('❌ Manual refresh error:', error)
    } finally {
      setLoading(false)
      console.log('🔄 Manual refresh: setLoading(false)')
    }
  }, [fetchMarketData, fetchParticipants])

  // Set up smart polling (only after initial load)
  const { refresh: manualRefresh, getStatus } = useSmartPolling({
    enabled: enabled && !!marketId && initialLoadComplete,
    interval: pollingInterval,
    onPoll: backgroundRefresh,
    dependencies: [marketId, pollingInterval] // Add pollingInterval to dependencies
  })

  // Update refs when data changes
  useEffect(() => {
    marketRef.current = market
  }, [market])

  useEffect(() => {
    participantsRef.current = participants
  }, [participants])

  // Debug logging for loading state
  useEffect(() => {
    console.log('🔍 Loading state changed:', { 
      loading, 
      initialLoadComplete, 
      marketId, 
      hasMarket: !!market,
      participantsCount: participants.length,
      participantsRetryCount
    })
  }, [loading, initialLoadComplete, marketId, market, participants.length, participantsRetryCount])

  // Set loading to false when we have market data and initial load is complete
  useEffect(() => {
    if (initialLoadComplete && market) {
      console.log('✅ Setting loading to false - market loaded and initial load complete')
      setLoading(false)
    }
  }, [initialLoadComplete, market])

  // Fallback: Set loading to false after a reasonable time even if no market data
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (loading && initialLoadComplete) {
        console.log('⚠️ Fallback: Setting loading to false after timeout')
        setLoading(false)
      }
    }, 5000) // 5 second fallback

    return () => clearTimeout(fallbackTimeout)
  }, [loading, initialLoadComplete])

  // Get polling status
  const pollingStatus = getStatus()

  return {
    // Data
    market,
    participants,
    loading,
    participantsLoading,
    error,
    lastUpdated,
    
    // Actions
    refresh: manualRefresh,
    refreshData,
    
    // Status
    pollingStatus,
    isPolling: pollingStatus.isActive,
    isPageVisible: pollingStatus.isPageVisible,
    timeSinceLastPoll: pollingStatus.timeSinceLastPoll,
    isRefreshing,
    hasUpdates,
    initialLoadComplete
  }
}
