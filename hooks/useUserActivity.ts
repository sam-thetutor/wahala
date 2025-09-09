import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { UserActivity, UserStats, ActivityFilters, UserActivityResponse } from '@/types/profile';

interface UseUserActivityReturn {
  activities: UserActivity[];
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
  setFilters: (filters: ActivityFilters) => void;
  filters: ActivityFilters;
}

export function useUserActivity(initialFilters: ActivityFilters = {}): UseUserActivityReturn {
  const { address } = useAccount();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (page = 1, reset = false) => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.marketId && { marketId: filters.marketId }),
        ...(filters.minAmount && { minAmount: filters.minAmount.toString() }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount.toString() }),
        ...(filters.dateRange && {
          startDate: filters.dateRange.start.toISOString(),
          endDate: filters.dateRange.end.toISOString()
        })
      });

      const response = await fetch(`/api/user/${address}/activity?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }

      const data: UserActivityResponse = await response.json();
      
      if (reset) {
        setActivities(data.activities);
      } else {
        setActivities(prev => [...prev, ...data.activities]);
      }
      
      setStats(data.stats);
      setPagination(data.pagination);
      setHasMore(data.pagination.page < data.pagination.totalPages);
      
    } catch (err) {
      console.error('Error fetching user activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [address, filters, pagination.limit]);

  const refetch = useCallback(() => {
    fetchActivities(1, true);
  }, [fetchActivities]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(pagination.page + 1, false);
    }
  }, [loading, hasMore, pagination.page, fetchActivities]);

  const handleSetFilters = useCallback((newFilters: ActivityFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    setHasMore(true);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (address) {
      fetchActivities(1, true);
    }
  }, [address, fetchActivities]);

  // Refetch when filters change
  useEffect(() => {
    if (address) {
      fetchActivities(1, true);
    }
  }, [filters, address, fetchActivities]);

  return {
    activities,
    stats,
    loading,
    error,
    pagination,
    refetch,
    loadMore,
    hasMore,
    setFilters: handleSetFilters,
    filters
  };
}
