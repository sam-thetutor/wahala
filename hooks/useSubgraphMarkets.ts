import { useState, useEffect, useCallback } from 'react'
import { subgraphApi, transformMarket, SubgraphMarket } from '@/lib/subgraph'

export interface Market {
  id: string
  question: string
  description: string
  source: string
  totalPool: string // CELO as string
  totalYes: string // CELO as string
  totalNo: string // CELO as string
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED'
  creator: string
  createdAt: string
  endTime: string
  resolver?: string
  resolvedAt?: string | null
  outcome?: boolean
  image?: string
}

export function useSubgraphMarkets() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 useSubgraphMarkets: Fetching markets from subgraph...')
      const subgraphMarkets = await subgraphApi.getMarkets()
      console.log('🔍 useSubgraphMarkets: Raw subgraph data:', subgraphMarkets)
      
      const transformedMarkets = subgraphMarkets.map(transformMarket)
      console.log('🔍 useSubgraphMarkets: Transformed markets:', transformedMarkets)
      
      setMarkets(transformedMarkets)
    } catch (err) {
      console.error('Error fetching markets from subgraph:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch markets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMarkets()
  }, [fetchMarkets])

  return {
    markets,
    loading,
    error,
    refetch: fetchMarkets
  }
}

export function useSubgraphMarket(marketId: string) {
  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMarket = useCallback(async () => {
    if (!marketId) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching market from subgraph:', marketId)
      const subgraphMarket = await subgraphApi.getMarket(marketId)
      console.log('🔍 Raw subgraph market data:', subgraphMarket)
      
      if (subgraphMarket) {
        const transformedMarket = transformMarket(subgraphMarket)
        console.log('🔍 Transformed market data:', transformedMarket)
        setMarket(transformedMarket)
      } else {
        console.log('🔍 No market found for ID:', marketId)
        setMarket(null)
      }
    } catch (err) {
      console.error('Error fetching market from subgraph:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch market')
    } finally {
      setLoading(false)
    }
  }, [marketId])

  useEffect(() => {
    fetchMarket()
  }, [fetchMarket])

  return {
    market,
    loading,
    error,
    refetch: fetchMarket
  }
}
