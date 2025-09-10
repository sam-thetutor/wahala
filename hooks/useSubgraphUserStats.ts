'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { subgraphApi, SubgraphUserComprehensiveStats } from '@/lib/subgraph';
import { formatEther } from 'viem';

export interface UserStats {
  // Basic stats
  totalMarketsCreated: number;
  totalTrades: number;
  totalVolume: string;
  totalWinnings: string;
  
  // Trading stats
  totalYesShares: string;
  totalNoShares: string;
  winRate: number;
  averageTradeSize: string;
  
  // Market creation stats
  marketCreationSuccessRate: number;
  resolvedCreatedMarkets: number;
  
  // Activity stats
  recentTrades: number;
  recentMarketsCreated: number;
  tradingDays: number;
  tradingFrequency: number;
  
  // Performance metrics
  totalParticipationValue: string;
  averageMarketParticipation: string;
  
  // Risk metrics
  riskTolerance: 'Conservative' | 'Aggressive' | 'Balanced';
  
  // Timestamps
  lastTradeAt: number | null;
  firstTradeAt: number | null;
  lastMarketCreatedAt: number | null;
  firstMarketCreatedAt: number | null;
  
  // Advanced metrics
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winStreak: number;
  lossStreak: number;
  averageWin: string;
  averageLoss: string;
  profitFactor: number;
  
  // Market performance
  totalCreatorFees: string;
  totalPlatformFees: string;
  netWinnings: string;
  
  // Trading patterns
  preferredSide: 'Yes' | 'No' | 'Balanced';
  averageHoldingPeriod: number; // in days
  tradingIntensity: 'Low' | 'Medium' | 'High';
}

interface UseSubgraphUserStatsReturn {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: number | null;
}

export function useSubgraphUserStats(): UseSubgraphUserStatsReturn {
  const { address } = useAccount();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const calculateStats = useCallback((data: SubgraphUserComprehensiveStats): UserStats => {
    const { participants, markets, winningsClaimeds, creatorFeeClaimeds } = data;
    
    // Basic counts
    const totalMarketsCreated = markets.length;
    const totalTrades = participants.reduce((sum, p) => sum + parseInt(p.transactionCount), 0);
    
    // Volume calculations
    const totalVolume = participants.reduce((sum, p) => sum + parseFloat(formatEther(BigInt(p.totalInvestment))), 0);
    const totalYesShares = participants.reduce((sum, p) => sum + parseFloat(formatEther(BigInt(p.totalYesShares))), 0);
    const totalNoShares = participants.reduce((sum, p) => sum + parseFloat(formatEther(BigInt(p.totalNoShares))), 0);
    
    // Winnings calculations
    const totalWinningsClaimed = winningsClaimeds.reduce((sum, w) => sum + parseFloat(formatEther(BigInt(w.amount))), 0);
    const totalCreatorFeesClaimed = creatorFeeClaimeds.reduce((sum, c) => sum + parseFloat(formatEther(BigInt(c.amount))), 0);
    const totalWinnings = totalWinningsClaimed + totalCreatorFeesClaimed;
    
    // Win rate calculation
    const resolvedMarkets = participants.filter(p => p.market.status === 'RESOLVED' && p.market.outcome !== undefined);
    const wonTrades = resolvedMarkets.filter(p => {
      const hasYesShares = parseFloat(formatEther(BigInt(p.totalYesShares))) > 0;
      const hasNoShares = parseFloat(formatEther(BigInt(p.totalNoShares))) > 0;
      
      if (p.market.outcome === true && hasYesShares) return true;
      if (p.market.outcome === false && hasNoShares) return true;
      return false;
    });
    
    const winRate = resolvedMarkets.length > 0 ? (wonTrades.length / resolvedMarkets.length) * 100 : 0;
    
    // Market creation success rate
    const resolvedCreatedMarkets = markets.filter(m => m.status === 'RESOLVED');
    const marketCreationSuccessRate = totalMarketsCreated > 0 ? (resolvedCreatedMarkets.length / totalMarketsCreated) * 100 : 0;
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);
    
    const recentTrades = participants.filter(p => 
      parseInt(p.lastPurchaseAt) >= thirtyDaysAgoTimestamp
    ).length;
    
    const recentMarketsCreated = markets.filter(m => 
      parseInt(m.createdAt) >= thirtyDaysAgoTimestamp
    ).length;
    
    // Trading days calculation
    const tradingDays = new Set(
      participants.map(p => 
        new Date(parseInt(p.lastPurchaseAt) * 1000).toDateString()
      )
    ).size;
    
    const tradingFrequency = tradingDays > 0 ? totalTrades / tradingDays : 0;
    
    // Risk tolerance calculation
    const riskTolerance = totalNoShares > totalYesShares ? 'Conservative' : 
                        totalYesShares > totalNoShares ? 'Aggressive' : 'Balanced';
    
    // Timestamps
    const lastTradeAt = participants.length > 0 ? 
      Math.max(...participants.map(p => parseInt(p.lastPurchaseAt))) : null;
    
    const firstTradeAt = participants.length > 0 ?
      Math.min(...participants.map(p => parseInt(p.firstPurchaseAt))) : null;
    
    const lastMarketCreatedAt = markets.length > 0 ?
      Math.max(...markets.map(m => parseInt(m.createdAt))) : null;
    
    const firstMarketCreatedAt = markets.length > 0 ?
      Math.min(...markets.map(m => parseInt(m.createdAt))) : null;
    
    // Advanced metrics
    const roi = totalVolume > 0 ? ((totalWinnings - totalVolume) / totalVolume) * 100 : 0;
    
    // Calculate win/loss streaks
    const sortedTrades = resolvedMarkets
      .map(p => ({
        won: (p.market.outcome === true && parseFloat(formatEther(BigInt(p.totalYesShares))) > 0) ||
             (p.market.outcome === false && parseFloat(formatEther(BigInt(p.totalNoShares))) > 0),
        timestamp: parseInt(p.lastPurchaseAt)
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    
    for (const trade of sortedTrades) {
      if (trade.won) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    }
    
    // Average win/loss
    const wins = wonTrades.map(p => parseFloat(formatEther(BigInt(p.totalInvestment))));
    const losses = resolvedMarkets
      .filter(p => !wonTrades.includes(p))
      .map(p => parseFloat(formatEther(BigInt(p.totalInvestment))));
    
    const averageWin = wins.length > 0 ? wins.reduce((sum, w) => sum + w, 0) / wins.length : 0;
    const averageLoss = losses.length > 0 ? losses.reduce((sum, l) => sum + l, 0) / losses.length : 0;
    
    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;
    
    // Trading patterns
    const preferredSide = totalYesShares > totalNoShares ? 'Yes' : 
                         totalNoShares > totalYesShares ? 'No' : 'Balanced';
    
    const averageHoldingPeriod = participants.length > 0 ? 
      participants.reduce((sum, p) => {
        const first = parseInt(p.firstPurchaseAt);
        const last = parseInt(p.lastPurchaseAt);
        return sum + (last - first) / (24 * 60 * 60); // Convert to days
      }, 0) / participants.length : 0;
    
    const tradingIntensity = tradingFrequency > 1 ? 'High' : 
                           tradingFrequency > 0.5 ? 'Medium' : 'Low';
    
    // Calculate platform fees (15% of losing shares)
    const totalPlatformFees = resolvedMarkets.reduce((sum, p) => {
      const market = p.market;
      const totalLosingShares = market.outcome === true ? 
        parseFloat(formatEther(BigInt(market.totalNo))) : 
        parseFloat(formatEther(BigInt(market.totalYes)));
      return sum + (totalLosingShares * 0.15);
    }, 0);
    
    const netWinnings = totalWinnings - totalPlatformFees;
    
    return {
      // Basic stats
      totalMarketsCreated,
      totalTrades,
      totalVolume: totalVolume.toString(),
      totalWinnings: totalWinnings.toString(),
      
      // Trading stats
      totalYesShares: totalYesShares.toString(),
      totalNoShares: totalNoShares.toString(),
      winRate: Math.round(winRate * 100) / 100,
      averageTradeSize: totalTrades > 0 ? (totalVolume / totalTrades).toString() : '0',
      
      // Market creation stats
      marketCreationSuccessRate: Math.round(marketCreationSuccessRate * 100) / 100,
      resolvedCreatedMarkets: resolvedCreatedMarkets.length,
      
      // Activity stats
      recentTrades,
      recentMarketsCreated,
      tradingDays,
      tradingFrequency: Math.round(tradingFrequency * 100) / 100,
      
      // Performance metrics
      totalParticipationValue: (totalYesShares + totalNoShares).toString(),
      averageMarketParticipation: totalMarketsCreated > 0 ? 
        (totalTrades / totalMarketsCreated).toString() : '0',
      
      // Risk metrics
      riskTolerance,
      
      // Timestamps
      lastTradeAt,
      firstTradeAt,
      lastMarketCreatedAt,
      firstMarketCreatedAt,
      
      // Advanced metrics
      roi: Math.round(roi * 100) / 100,
      sharpeRatio: 0, // Would need more complex calculation
      maxDrawdown: 0, // Would need more complex calculation
      winStreak: maxWinStreak,
      lossStreak: maxLossStreak,
      averageWin: averageWin.toString(),
      averageLoss: averageLoss.toString(),
      profitFactor: Math.round(profitFactor * 100) / 100,
      
      // Market performance
      totalCreatorFees: totalCreatorFeesClaimed.toString(),
      totalPlatformFees: totalPlatformFees.toString(),
      netWinnings: netWinnings.toString(),
      
      // Trading patterns
      preferredSide,
      averageHoldingPeriod: Math.round(averageHoldingPeriod * 100) / 100,
      tradingIntensity
    };
  }, []);

  const fetchStats = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const data = await subgraphApi.getUserComprehensiveStats(address);
      const calculatedStats = calculateStats(data);
      
      setStats(calculatedStats);
      setLastUpdated(Date.now());
      
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
    } finally {
      setLoading(false);
    }
  }, [address, calculateStats]);

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
    refetch,
    lastUpdated
  };
}
