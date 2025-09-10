import { useState, useEffect, useCallback, useRef } from 'react'
import { useSubgraphMarket, Market } from './useSubgraphMarkets'
import { useSubgraphParticipants, Participant } from './useSubgraphParticipants'

interface UseSubgraphMarketDetailsOptions {
  marketId: string
  enabled?: boolean
}

export const useSubgraphMarketDetails = ({ 
  marketId, 
  enabled = true
}: UseSubgraphMarketDetailsOptions) => {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(true)
  const [participantsError, setParticipantsError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasUpdates, setHasUpdates] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  
  // Get market data from subgraph
  const { 
    market, 
    loading: marketLoading, 
    error: marketError, 
    refetch: refetchMarket 
  } = useSubgraphMarket(marketId)
  
  // Get participants data from subgraph
  const { 
    participants: subgraphParticipants,
    loading: subgraphParticipantsLoading,
    error: subgraphParticipantsError,
    refetch: refetchParticipants
  } = useSubgraphParticipants(marketId)

  // Use refs to store current values for comparison
  const marketRef = useRef<Market | null>(null)
  const participantsRef = useRef<Participant[]>([])

  // Update participants when subgraph data changes
  useEffect(() => {
    if (subgraphParticipants) {
      const prevParticipants = participantsRef.current
      const newParticipants = subgraphParticipants
      
      // Check if participants have changed
      const participantsChanged = 
        prevParticipants.length !== newParticipants.length ||
        prevParticipants.some((prev, index) => {
          const current = newParticipants[index]
          return !current || 
            prev.user !== current.user ||
            prev.totalInvestment !== current.totalInvestment ||
            prev.totalYesShares !== current.totalYesShares ||
            prev.totalNoShares !== current.totalNoShares
        })

      if (participantsChanged) {
        console.log('🔄 Participants updated from subgraph:', {
          previous: prevParticipants.length,
          current: newParticipants.length,
          changes: participantsChanged
        })
        
        setParticipants(newParticipants)
        participantsRef.current = newParticipants
        setLastUpdated(new Date())
        setHasUpdates(true)
      }
      
      setParticipantsLoading(subgraphParticipantsLoading)
      setParticipantsError(subgraphParticipantsError)
    }
  }, [subgraphParticipants, subgraphParticipantsLoading, subgraphParticipantsError])

  // Update market when subgraph data changes
  useEffect(() => {
    if (market) {
      const prevMarket = marketRef.current
      
      // Check if market data has changed
      const marketChanged = !prevMarket || 
        prevMarket.totalPool !== market.totalPool ||
        prevMarket.totalYes !== market.totalYes ||
        prevMarket.totalNo !== market.totalNo ||
        prevMarket.status !== market.status

      if (marketChanged) {
        console.log('🔄 Market updated from subgraph:', {
          id: market.id,
          totalPool: market.totalPool,
          totalYes: market.totalYes,
          totalNo: market.totalNo,
          status: market.status,
          changed: marketChanged
        })
        
        marketRef.current = market
        setLastUpdated(new Date())
        setHasUpdates(true)
      }
    }
  }, [market])

  // Set initial load complete
  useEffect(() => {
    if (market && !marketLoading && !participantsLoading) {
      setInitialLoadComplete(true)
    }
  }, [market, marketLoading, participantsLoading])

  // Refresh function
  const refresh = useCallback(async () => {
    if (!enabled) return
    
    console.log('🔄 Refreshing market details from subgraph...')
    setIsRefreshing(true)
    
    try {
      await Promise.all([
        refetchMarket(),
        refetchParticipants()
      ])
      
      console.log('✅ Market details refreshed from subgraph')
    } catch (error) {
      console.error('❌ Error refreshing market details:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [enabled, refetchMarket, refetchParticipants])

  // Simple refresh function
  const retryParticipants = useCallback(async () => {
    console.log('🔄 Retrying participants...')
    try {
      await refetchParticipants()
    } catch (error) {
      console.error('❌ Error retrying participants:', error)
    }
  }, [refetchParticipants])

  return {
    market,
    participants,
    loading: marketLoading || participantsLoading,
    participantsLoading,
    error: marketError || participantsError,
    lastUpdated,
    refresh,
    isRefreshing,
    hasUpdates,
    initialLoadComplete,
    retryParticipants
  }
}
