'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { subgraphApi, SubgraphUserMarketsWithPerformance } from '@/lib/subgraph';
import { formatEther } from 'viem';

export interface UserMarket {
  id: string;
  question: string;
  description: string;
  status: string;
  outcome?: boolean;
  totalPool: string;
  totalYes: string;
  totalNo: string;
  createdAt: number;
  endTime: number;
  resolvedAt?: number;
  creator: string;
  
  // Performance metrics
  participantCount: number;
  totalTransactions: number;
  averageInvestment: string;
  engagementScore: number;
  
  // Creator earnings
  creatorFeesEarned: string;
  creatorFeesClaimed: string;
  pendingCreatorFees: string;
  
  // Market health
  participationTrend: 'increasing' | 'decreasing' | 'stable';
  timeToResolution: number; // in days
  resolutionPrediction: 'likely_yes' | 'likely_no' | 'uncertain';
  
  // Trading activity
  recentActivity: {
    lastTradeAt: number | null;
    tradesLast24h: number;
    tradesLast7d: number;
  };
}

interface MarketFilters {
  status?: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  outcome?: boolean;
  minPool?: number;
  maxPool?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'created' | 'pool' | 'participants' | 'activity';
  sortOrder?: 'asc' | 'desc';
}

interface UseSubgraphUserMarketsReturn {
  markets: UserMarket[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  filters: MarketFilters;
  setFilters: (filters: MarketFilters) => void;
  stats: {
    totalMarkets: number;
    activeMarkets: number;
    resolvedMarkets: number;
    totalVolume: string;
    totalCreatorFees: string;
    averageEngagement: number;
  };
}

export function useSubgraphUserMarkets(initialFilters: MarketFilters = {}): UseSubgraphUserMarketsReturn {
  const { address } = useAccount();
  const [markets, setMarkets] = useState<UserMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MarketFilters>(initialFilters);

  const transformMarket = useCallback((market: any, allParticipants: any[], allCreatorFeeClaimeds: any[]): UserMarket => {
    // Find participants for this market
    const marketParticipants = allParticipants.filter(p => p.market.id === market.id);
    const participantCount = marketParticipants.length;
    const totalTransactions = marketParticipants.reduce((sum: number, p: any) => 
      sum + parseInt(p.transactionCount), 0
    );
    
    const totalInvestment = marketParticipants.reduce((sum: number, p: any) => 
      sum + parseFloat(formatEther(BigInt(p.totalInvestment))), 0
    );
    
    const averageInvestment = participantCount > 0 ? totalInvestment / participantCount : 0;
    
    // Find creator fee claims for this market
    const marketCreatorFeeClaimeds = allCreatorFeeClaimeds.filter(c => c.marketId === market.id);
    const totalCreatorFeesClaimed = marketCreatorFeeClaimeds.reduce((sum: number, c: any) => 
      sum + parseFloat(formatEther(BigInt(c.amount))), 0
    );
    
    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, 
      (participantCount * 10) + 
      (totalTransactions * 2) + 
      (totalInvestment / 100) // Scale down large investments
    );
    
    // Creator fees (already calculated above)
    const creatorFeesClaimed = totalCreatorFeesClaimed;
    
    // Calculate potential creator fees (15% of losing shares)
    const totalLosingShares = market.outcome === true ? 
      parseFloat(formatEther(BigInt(market.totalNo))) : 
      market.outcome === false ? 
      parseFloat(formatEther(BigInt(market.totalYes))) : 0;
    
    const potentialCreatorFees = totalLosingShares * 0.15;
    const pendingCreatorFees = Math.max(0, potentialCreatorFees - creatorFeesClaimed);
    
    // Participation trend (simplified - would need historical data for accuracy)
    const participationTrend = participantCount > 5 ? 'increasing' : 
                              participantCount < 3 ? 'decreasing' : 'stable';
    
    // Time to resolution
    const now = Math.floor(Date.now() / 1000);
    const timeToResolution = market.status === 'RESOLVED' ? 
      (market.resolvedAt - market.createdAt) / (24 * 60 * 60) : // days from creation to resolution
      (market.endTime - now) / (24 * 60 * 60); // days until end time
    
    // Resolution prediction based on current odds
    const yesPercentage = parseFloat(formatEther(BigInt(market.totalYes))) / 
      (parseFloat(formatEther(BigInt(market.totalYes))) + parseFloat(formatEther(BigInt(market.totalNo))));
    
    const resolutionPrediction = yesPercentage > 0.6 ? 'likely_yes' :
                                yesPercentage < 0.4 ? 'likely_no' : 'uncertain';
    
    // Recent activity (simplified - would need more detailed data)
    const lastTradeAt = market.participants.length > 0 ? 
      Math.max(...market.participants.map((p: any) => parseInt(p.lastPurchaseAt))) : null;
    
    const now24h = now - (24 * 60 * 60);
    const now7d = now - (7 * 24 * 60 * 60);
    
    const tradesLast24h = market.participants.filter((p: any) => 
      parseInt(p.lastPurchaseAt) >= now24h
    ).length;
    
    const tradesLast7d = market.participants.filter((p: any) => 
      parseInt(p.lastPurchaseAt) >= now7d
    ).length;

    return {
      id: market.id,
      question: market.question,
      description: market.description,
      status: market.status,
      outcome: market.outcome,
      totalPool: formatEther(BigInt(market.totalPool)),
      totalYes: formatEther(BigInt(market.totalYes)),
      totalNo: formatEther(BigInt(market.totalNo)),
      createdAt: parseInt(market.createdAt),
      endTime: parseInt(market.endTime),
      resolvedAt: market.resolvedAt ? parseInt(market.resolvedAt) : undefined,
      creator: market.creator,
      
      // Performance metrics
      participantCount,
      totalTransactions,
      averageInvestment: averageInvestment.toString(),
      engagementScore: Math.round(engagementScore),
      
      // Creator earnings
      creatorFeesEarned: potentialCreatorFees.toString(),
      creatorFeesClaimed: creatorFeesClaimed.toString(),
      pendingCreatorFees: pendingCreatorFees.toString(),
      
      // Market health
      participationTrend,
      timeToResolution: Math.round(timeToResolution * 100) / 100,
      resolutionPrediction,
      
      // Trading activity
      recentActivity: {
        lastTradeAt,
        tradesLast24h,
        tradesLast7d
      }
    };
  }, []);

  const fetchMarkets = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const data = await subgraphApi.getUserMarketsWithPerformance(address);
      const transformedMarkets = data.markets.map(market => 
        transformMarket(market, data.participants, data.creatorFeeClaimeds)
      );
      
      // Apply filters
      let filteredMarkets = transformedMarkets;
      
      if (filters.status) {
        filteredMarkets = filteredMarkets.filter(m => m.status === filters.status);
      }
      
      if (filters.outcome !== undefined) {
        filteredMarkets = filteredMarkets.filter(m => m.outcome === filters.outcome);
      }
      
      if (filters.minPool !== undefined) {
        filteredMarkets = filteredMarkets.filter(m => 
          parseFloat(m.totalPool) >= filters.minPool!
        );
      }
      
      if (filters.maxPool !== undefined) {
        filteredMarkets = filteredMarkets.filter(m => 
          parseFloat(m.totalPool) <= filters.maxPool!
        );
      }
      
      if (filters.startDate) {
        const startTimestamp = Math.floor(filters.startDate.getTime() / 1000);
        filteredMarkets = filteredMarkets.filter(m => m.createdAt >= startTimestamp);
      }
      
      if (filters.endDate) {
        const endTimestamp = Math.floor(filters.endDate.getTime() / 1000);
        filteredMarkets = filteredMarkets.filter(m => m.createdAt <= endTimestamp);
      }
      
      // Apply sorting
      const sortBy = filters.sortBy || 'created';
      const sortOrder = filters.sortOrder || 'desc';
      
      filteredMarkets.sort((a, b) => {
        let aValue: number, bValue: number;
        
        switch (sortBy) {
          case 'created':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'pool':
            aValue = parseFloat(a.totalPool);
            bValue = parseFloat(b.totalPool);
            break;
          case 'participants':
            aValue = a.participantCount;
            bValue = b.participantCount;
            break;
          case 'activity':
            aValue = a.engagementScore;
            bValue = b.engagementScore;
            break;
          default:
            aValue = a.createdAt;
            bValue = b.createdAt;
        }
        
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
      
      setMarkets(filteredMarkets);
      
    } catch (err) {
      console.error('Error fetching user markets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user markets');
    } finally {
      setLoading(false);
    }
  }, [address, filters, transformMarket]);

  const refetch = useCallback(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const handleSetFilters = useCallback((newFilters: MarketFilters) => {
    setFilters(newFilters);
  }, []);

  // Calculate stats
  const stats = {
    totalMarkets: markets.length,
    activeMarkets: markets.filter(m => m.status === 'ACTIVE').length,
    resolvedMarkets: markets.filter(m => m.status === 'RESOLVED').length,
    totalVolume: markets.reduce((sum, m) => sum + parseFloat(m.totalPool), 0).toString(),
    totalCreatorFees: markets.reduce((sum, m) => sum + parseFloat(m.creatorFeesClaimed), 0).toString(),
    averageEngagement: markets.length > 0 ? 
      markets.reduce((sum, m) => sum + m.engagementScore, 0) / markets.length : 0
  };

  // Initial fetch
  useEffect(() => {
    if (address) {
      fetchMarkets();
    }
  }, [address, fetchMarkets]);

  // Refetch when filters change
  useEffect(() => {
    if (address) {
      fetchMarkets();
    }
  }, [filters, address, fetchMarkets]);

  return {
    markets,
    loading,
    error,
    refetch,
    filters,
    setFilters: handleSetFilters,
    stats
  };
}
