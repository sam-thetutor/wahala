'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { subgraphApi, SubgraphUserActivityFeed } from '@/lib/subgraph';
import { formatEther } from 'viem';

export interface UserActivity {
  id: string;
  type: 'trading' | 'market_created' | 'winnings_claimed' | 'creator_fee_claimed';
  timestamp: number;
  transactionHash: string;
  marketId: string;
  marketQuestion: string;
  marketStatus: string;
  marketOutcome?: boolean;
  
  // Trading specific
  side?: boolean; // true for Yes, false for No
  amount?: string;
  totalYes?: string;
  totalNo?: string;
  
  // Market creation specific
  totalPool?: string;
  endTime?: string;
  
  // Claims specific
  claimAmount?: string;
  
  // Additional context
  description: string;
  icon: string;
  color: string;
}

interface ActivityFilters {
  type?: 'trading' | 'market_created' | 'winnings_claimed' | 'creator_fee_claimed';
  marketId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

interface UseSubgraphUserActivityReturn {
  activities: UserActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
  filters: ActivityFilters;
  setFilters: (filters: ActivityFilters) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export function useSubgraphUserActivity(initialFilters: ActivityFilters = {}): UseSubgraphUserActivityReturn {
  const { address } = useAccount();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });
  const [hasMore, setHasMore] = useState(true);

  const transformActivity = useCallback((item: any, type: string, marketData?: any): UserActivity => {
    const timestamp = parseInt(item.blockTimestamp || item.createdAt);
    
    let activity: UserActivity = {
      id: item.id,
      type: type as any,
      timestamp,
      transactionHash: item.transactionHash || '',
      marketId: item.marketId || item.id,
      marketQuestion: marketData?.question || '',
      marketStatus: marketData?.status || item.status || 'ACTIVE',
      marketOutcome: marketData?.outcome,
      description: '',
      icon: '',
      color: ''
    };

    switch (type) {
      case 'trading':
        activity.side = item.side;
        activity.amount = formatEther(BigInt(item.amount));
        activity.totalYes = formatEther(BigInt(item.totalYes));
        activity.totalNo = formatEther(BigInt(item.totalNo));
        const marketQuestion = marketData?.question || 'Unknown Market';
        activity.description = `Bought ${item.side ? 'YES' : 'NO'} shares for ${formatEther(BigInt(item.amount))} CELO`;
        activity.marketQuestion = marketQuestion;
        activity.icon = '💰';
        activity.color = 'text-green-600';
        break;
        
      case 'market_created':
        activity.totalPool = formatEther(BigInt(item.totalPool));
        activity.endTime = item.endTime;
        activity.description = `Created market: "${item.question}"`;
        activity.icon = '📊';
        activity.color = 'text-blue-600';
        break;
        
      case 'winnings_claimed':
        activity.claimAmount = formatEther(BigInt(item.amount));
        activity.description = `Claimed ${formatEther(BigInt(item.amount))} CELO in winnings`;
        activity.icon = '🏆';
        activity.color = 'text-yellow-600';
        break;
        
      case 'creator_fee_claimed':
        activity.claimAmount = formatEther(BigInt(item.amount));
        activity.description = `Claimed ${formatEther(BigInt(item.amount))} CELO in creator fees`;
        activity.icon = '💎';
        activity.color = 'text-purple-600';
        break;
    }

    return activity;
  }, []);

  const fetchActivities = useCallback(async (page = 1, reset = false) => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const skip = (page - 1) * pagination.limit;
      const data = await subgraphApi.getUserActivityFeed(address, pagination.limit, skip);
      
      // Combine markets from both sources and deduplicate
      const allMarkets = [
        ...data.markets,
        ...data.participants.map(p => p.market)
      ];
      
      const uniqueMarkets = allMarkets.reduce((acc, market) => {
        if (!acc.find(m => m.id === market.id)) {
          acc.push(market);
        }
        return acc;
      }, [] as any[]);
      
      // Transform all activities into a unified format
      const allActivities: UserActivity[] = [];
      
      // Add trading activities
      data.sharesBoughts.forEach(item => {
        // Find market data for this trading activity
        const marketData = uniqueMarkets.find(m => m.id === item.marketId);
        allActivities.push(transformActivity(item, 'trading', marketData));
      });
      
      // Add market creation activities
      data.markets.forEach(item => {
        allActivities.push(transformActivity(item, 'market_created', item));
      });
      
      // Add winnings claimed activities
      data.winningsClaimeds.forEach(item => {
        // Find market data for this claim
        const marketData = uniqueMarkets.find(m => m.id === item.marketId);
        allActivities.push(transformActivity(item, 'winnings_claimed', marketData));
      });
      
      // Add creator fee claimed activities
      data.creatorFeeClaimeds.forEach(item => {
        // Find market data for this claim
        const marketData = uniqueMarkets.find(m => m.id === item.marketId);
        allActivities.push(transformActivity(item, 'creator_fee_claimed', marketData));
      });
      
      // Sort by timestamp (newest first)
      allActivities.sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply filters
      let filteredActivities = allActivities;
      
      if (filters.type) {
        filteredActivities = filteredActivities.filter(a => a.type === filters.type);
      }
      
      if (filters.marketId) {
        filteredActivities = filteredActivities.filter(a => a.marketId === filters.marketId);
      }
      
      if (filters.startDate) {
        const startTimestamp = Math.floor(filters.startDate.getTime() / 1000);
        filteredActivities = filteredActivities.filter(a => a.timestamp >= startTimestamp);
      }
      
      if (filters.endDate) {
        const endTimestamp = Math.floor(filters.endDate.getTime() / 1000);
        filteredActivities = filteredActivities.filter(a => a.timestamp <= endTimestamp);
      }
      
      if (filters.minAmount !== undefined) {
        filteredActivities = filteredActivities.filter(a => {
          const amount = parseFloat(a.amount || a.claimAmount || '0');
          return amount >= filters.minAmount!;
        });
      }
      
      if (filters.maxAmount !== undefined) {
        filteredActivities = filteredActivities.filter(a => {
          const amount = parseFloat(a.amount || a.claimAmount || '0');
          return amount <= filters.maxAmount!;
        });
      }
      
      // Update state
      if (reset) {
        setActivities(filteredActivities);
      } else {
        setActivities(prev => [...prev, ...filteredActivities]);
      }
      
      setPagination(prev => ({
        ...prev,
        page,
        total: filteredActivities.length
      }));
      
      setHasMore(filteredActivities.length === pagination.limit);
      
    } catch (err) {
      console.error('Error fetching user activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user activities');
    } finally {
      setLoading(false);
    }
  }, [address, pagination.limit, filters, transformActivity]);

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
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    filters,
    setFilters: handleSetFilters,
    pagination
  };
}
