import { useState, useEffect, useCallback } from 'react'
import { MarketParticipant } from '@/lib/supabase'

interface UseMarketParticipantsReturn {
  participants: MarketParticipant[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMarketParticipants(marketId: string): UseMarketParticipantsReturn {
  const [participants, setParticipants] = useState<MarketParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchParticipants = useCallback(async () => {
    if (!marketId) {
      setParticipants([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/markets/${marketId}/participants`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch participants: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setParticipants(data.participants || [])
      } else {
        throw new Error(data.error || 'Failed to fetch participants')
      }
    } catch (err) {
      console.error('Error fetching market participants:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch participants')
      setParticipants([])
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
