import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { UserEvent, EventFilters, UserEventsResponse } from '@/types/profile';

interface UseUserEventsReturn {
  events: UserEvent[];
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
  setFilters: (filters: EventFilters) => void;
  filters: EventFilters;
}

export function useUserEvents(initialFilters: EventFilters = {}): UseUserEventsReturn {
  const { address } = useAccount();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [hasMore, setHasMore] = useState(true);

  const fetchEvents = useCallback(async (page = 1, reset = false) => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.marketId && { marketId: filters.marketId }),
        ...(filters.dateRange && {
          startDate: filters.dateRange.start.toISOString(),
          endDate: filters.dateRange.end.toISOString()
        })
      });

      const response = await fetch(`/api/user/${address}/events?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data: UserEventsResponse = await response.json();
      
      if (reset) {
        setEvents(data.events);
      } else {
        setEvents(prev => [...prev, ...data.events]);
      }
      
      setPagination(data.pagination);
      setHasMore(data.pagination.page < data.pagination.totalPages);
      
    } catch (err) {
      console.error('Error fetching user events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [address, filters, pagination.limit]);

  const refetch = useCallback(() => {
    fetchEvents(1, true);
  }, [fetchEvents]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchEvents(pagination.page + 1, false);
    }
  }, [loading, hasMore, pagination.page, fetchEvents]);

  const handleSetFilters = useCallback((newFilters: EventFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    setHasMore(true);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (address) {
      fetchEvents(1, true);
    }
  }, [address, fetchEvents]);

  // Refetch when filters change
  useEffect(() => {
    if (address) {
      fetchEvents(1, true);
    }
  }, [filters, address, fetchEvents]);

  return {
    events,
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
