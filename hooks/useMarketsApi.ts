import { useState, useEffect, useMemo, useCallback } from 'react';

interface MarketData {
  id: string;
  question: string;
  endtime: string;
  totalpool: string;
  totalyes: string;
  totalno: string;
  status: number;
  outcome: boolean;
  createdat: string;
  creator: string;
  description: string;
  category: string;
  image: string;
  source: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalMarkets: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Stats {
  totalMarkets: number;
  activeMarkets: number;
  resolvedMarkets: number;
  totalVolume: string;
}

interface MarketsResponse {
  markets: MarketData[];
  pagination: PaginationInfo;
  categories: Category[];
  stats: Stats;
}

interface UseMarketsApiOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: 'newest' | 'oldest' | 'volume' | 'ending';
  status?: string;
}

export function useMarketsApi(options: UseMarketsApiOptions = {}) {
  const [data, setData] = useState<MarketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    page = 1,
    limit = 12,
    search = '',
    category = '',
    sortBy = 'newest',
    status = ''
  } = options;

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        category,
        sortBy,
        status
      });

      const response = await fetch(`/api/markets?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, category, sortBy, status]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const refetch = useCallback(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return {
    markets: data?.markets || [],
    allMarkets: data?.markets || [], // For compatibility with existing code
    categories: data?.categories || [],
    stats: data?.stats || {
      totalMarkets: 0,
      activeMarkets: 0,
      resolvedMarkets: 0,
      totalVolume: '0'
    },
    pagination: data?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalMarkets: 0,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 12
    },
    loading,
    error,
    refetch
  };
}

// Hook for getting all markets without pagination (for stats)
export function useAllMarketsApi() {
  const [data, setData] = useState<MarketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/markets?limit=1000'); // Get all markets
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching all markets:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllMarkets();
  }, [fetchAllMarkets]);

  return {
    allMarkets: data?.markets || [],
    stats: data?.stats || {
      totalMarkets: 0,
      activeMarkets: 0,
      resolvedMarkets: 0,
      totalVolume: '0'
    },
    loading,
    error,
    refetch: fetchAllMarkets
  };
}

