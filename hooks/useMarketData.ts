import { useState, useEffect, useCallback, useRef } from 'react'
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
  outcome?: boolean
  isEnded?: boolean
  participants: any[]
}

interface UseMarketDataOptions {
  marketId: string
  enabled?: boolean
  pollingInterval?: number
}

export const useMarketData = ({ 
  marketId, 
  enabled = true, 
  pollingInterval = 3000 
}: UseMarketDataOptions) => {
  const [market, setMarket] = useState<MarketData | null>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasUpdates, setHasUpdates] = useState(false)
  
  // Use refs to store current values for comparison
  const marketRef = useRef<MarketData | null>(null)
  const participantsRef = useRef<any[]>([])

  // Fetch market data (silent background update)
  const fetchMarketData = useCallback(async (isBackground = false) => {
    if (!marketId) {
      console.log('❌ fetchMarketData: No marketId provided')
      return
    }

    try {
      if (isBackground) {
        console.log('🔄 Background refresh: Fetching market data for:', marketId)
        setIsRefreshing(true)
      } else {
        console.log('📊 Initial fetch: Market data for:', marketId)
      }
      
      console.log('🌐 Making API call to:', `/api/markets/${marketId}`)
      const response = await fetch(`/api/markets/${marketId}`)
      console.log('📡 API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API error response:', errorText)
        throw new Error(`Failed to fetch market: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📦 API response data:', data)
      const newMarket = data.market
      
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
      setLoading(false) // Make sure to set loading to false on error
    } finally {
      if (isBackground) {
        setIsRefreshing(false)
      }
    }
  }, [marketId])

  // Fetch participants data (silent background update)
  const fetchParticipants = useCallback(async (isBackground = false) => {
    if (!marketId) return

    try {
      if (isBackground) {
        console.log('🔄 Background refresh: Fetching participants for market:', marketId)
      } else {
        console.log('👥 Initial fetch: Participants for market:', marketId)
      }
      
      const response = await fetch(`/api/markets/${marketId}/participants`)
      if (!response.ok) throw new Error('Failed to fetch participants')
      
      const data = await response.json()
      const newParticipants = data.participants || []
      
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
    } catch (err) {
      console.error('❌ Error fetching participants:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [marketId])

  // Combined refresh function (for manual refresh)
  const refreshData = useCallback(async () => {
    console.log('🔄 refreshData called')
    setLoading(true)
    try {
      await Promise.all([fetchMarketData(false), fetchParticipants(false)])
      console.log('✅ refreshData completed successfully')
    } catch (error) {
      console.error('❌ refreshData error:', error)
    } finally {
      setLoading(false)
      console.log('🔄 refreshData: setLoading(false)')
    }
  }, [fetchMarketData, fetchParticipants])

  // Background refresh function (silent)
  const backgroundRefresh = useCallback(async () => {
    console.log('🔄 Background refresh triggered')
    await Promise.all([fetchMarketData(true), fetchParticipants(true)])
  }, [fetchMarketData, fetchParticipants])

  // Set up smart polling (background refresh)
  const { refresh: manualRefresh, getStatus } = useSmartPolling({
    enabled: enabled && !!marketId,
    interval: pollingInterval,
    onPoll: backgroundRefresh, // Use silent background refresh
    dependencies: [marketId]
  })

  // Update refs when state changes
  useEffect(() => {
    marketRef.current = market
  }, [market])

  useEffect(() => {
    participantsRef.current = participants
  }, [participants])

  // Initial data fetch
  useEffect(() => {
    console.log('🔄 useMarketData: Initial fetch triggered', { marketId, enabled })
    if (marketId) {
      refreshData()
    }
  }, [marketId, refreshData])

  // Get polling status
  const pollingStatus = getStatus()

  return {
    // Data
    market,
    participants,
    loading,
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
    hasUpdates
  }
}
