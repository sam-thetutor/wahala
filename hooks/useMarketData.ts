import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSubgraphMarkets } from './useSubgraphMarkets'

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
  marketId?: string
  enabled?: boolean
  pollingInterval?: number
}

export const useMarketData = ({ 
  marketId, 
  enabled = true 
}: UseMarketDataOptions) => {
  const [market, setMarket] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasUpdates, setHasUpdates] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  
  // Get all markets from subgraph
  const { markets: allMarkets, loading: marketsLoading, error: marketsError } = useSubgraphMarkets()

  // Find specific market
  const targetMarket = useMemo(() => {
    if (!marketId || !allMarkets) return null
    return allMarkets.find(m => m.id === marketId)
  }, [marketId, allMarkets])

  // Convert subgraph market to expected format
  const convertMarket = useCallback((subgraphMarket: any): MarketData => {
    return {
      id: subgraphMarket.id,
      question: subgraphMarket.question,
      totalpool: subgraphMarket.totalPool,
      totalyes: subgraphMarket.totalYes,
      totalno: subgraphMarket.totalNo,
      endtime: subgraphMarket.endTime,
      status: subgraphMarket.status,
      description: subgraphMarket.description,
      source: subgraphMarket.source,
      createdat: subgraphMarket.createdAt,
      outcome: subgraphMarket.outcome,
      isEnded: subgraphMarket.status === 'RESOLVED',
      participants: [] // Would need to fetch from participants hook
    }
  }, [])

  // Update market when data changes
  useEffect(() => {
    if (targetMarket) {
      const convertedMarket = convertMarket(targetMarket)
      setMarket(convertedMarket)
      setLastUpdated(new Date())
      setHasUpdates(true)
      setLoading(false)
      setError(null)
    } else if (marketId && !marketsLoading) {
      setError('Market not found')
      setLoading(false)
    }
  }, [targetMarket, marketId, marketsLoading, convertMarket])

  // Set initial load complete
  useEffect(() => {
    if (market && !marketsLoading) {
      setInitialLoadComplete(true)
    }
  }, [market, marketsLoading])

  // Refresh function
  const refresh = useCallback(async () => {
    if (!enabled) return
    
    console.log('🔄 Refreshing market data from subgraph...')
    setIsRefreshing(true)
    
    try {
      // The subgraph data will automatically update
      // No manual refresh needed
      console.log('✅ Market data refreshed from subgraph')
    } catch (error) {
      console.error('❌ Error refreshing market data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [enabled])

  return {
    market,
    loading: loading || marketsLoading,
    error: error || marketsError,
    lastUpdated,
    refresh,
    isRefreshing,
    hasUpdates,
    initialLoadComplete,
    getStatus: () => 'idle' // No polling status
  }
}