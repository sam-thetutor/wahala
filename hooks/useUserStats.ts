import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { UserStats } from '@/types/profile';

interface UseUserStatsReturn {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserStats(): UseUserStatsReturn {
  const { address } = useAccount();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/user/${address}/stats`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data.stats);
      
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
    } finally {
      setLoading(false);
    }
  }, [address]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  // Initial fetch
  useEffect(() => {
    if (address) {
      fetchStats();
    }
  }, [address, fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch
  };
}
