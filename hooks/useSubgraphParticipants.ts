import { useState, useEffect, useCallback } from 'react'
import { subgraphApi, transformParticipant, SubgraphParticipant } from '@/lib/subgraph'

export interface Participant {
  id: string
  user: string
  totalInvestment: string // CELO as string
  totalYesShares: string // CELO as string
  totalNoShares: string // CELO as string
  firstPurchaseAt: string
  lastPurchaseAt: string
  transactionCount: string
}

export function useSubgraphParticipants(marketId: string) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchParticipants = useCallback(async () => {
    if (!marketId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const subgraphParticipants = await subgraphApi.getParticipants(marketId)
      const transformedParticipants = subgraphParticipants.map(transformParticipant)
      
      setParticipants(transformedParticipants)
    } catch (err) {
      console.error('Error fetching participants from subgraph:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch participants')
    } finally {
      setLoading(false)
    }
  }, [marketId])

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  return {
    participants,
    loading,
    error,
    refetch: fetchParticipants
  }
}
