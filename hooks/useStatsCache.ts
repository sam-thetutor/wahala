import { useState, useEffect, useCallback } from 'react';
import { useAllMarketsApi } from './useMarketsApi';
import { formatEther } from 'viem';

interface StatsData {
  totalMarkets: number;
  activeTraders: number;
  totalVolume: bigint;
  marketsResolved: number;
  lastUpdated: number;
}

const CACHE_DURATION = 30000; // 30 seconds cache

export function useStatsCache() {
  const [stats, setStats] = useState<StatsData>({
    totalMarkets: 0,
    activeTraders: 0,
    totalVolume: 0n,
    marketsResolved: 0,
    lastUpdated: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  
  const { allMarkets, stats: dbStats, loading: marketsLoading } = useAllMarketsApi();

  // Check if cache is stale
  const isCacheStale = useCallback(() => {
    return Date.now() - stats.lastUpdated > CACHE_DURATION;
  }, [stats.lastUpdated]);

  // Calculate stats from database only
  const calculateStats = useCallback(() => {
    console.log('🔍 StatsCache: Calculating stats from database...', { 
      allMarketsLength: allMarkets.length,
      dbStats,
      marketsLoading
    });
    
    // Use database stats as base
    const totalMarketsCount = dbStats.totalMarkets;
    const marketsResolved = dbStats.resolvedMarkets;
    const totalVolume = BigInt(dbStats.totalVolume || '0');
    
    console.log('📊 Database stats:', {
      totalMarkets: totalMarketsCount,
      marketsResolved,
      totalVolume: formatEther(totalVolume),
      marketsWithData: allMarkets.filter(m => m.question && m.question.length > 0).length,
      marketsWithVolume: allMarkets.filter(m => BigInt(m.totalpool) > 0n).length
    });

    // Count unique active traders from markets only
    const uniqueTraders = new Set<string>();
    
    // Add all market creators
    allMarkets.forEach(market => {
      if (market.creator && market.creator !== '0x0') {
        uniqueTraders.add(market.creator.toLowerCase());
      }
    });

    const newStats: StatsData = {
      totalMarkets: totalMarketsCount,
      activeTraders: uniqueTraders.size,
      totalVolume,
      marketsResolved,
      lastUpdated: Date.now()
    };

    console.log('📊 Final stats:', {
      totalMarkets: newStats.totalMarkets,
      activeTraders: newStats.activeTraders,
      totalVolume: formatEther(newStats.totalVolume),
      marketsResolved: newStats.marketsResolved,
      lastUpdated: new Date(newStats.lastUpdated).toISOString()
    });

    return newStats;
  }, [allMarkets, dbStats, marketsLoading]);

  // Update stats when data changes or cache is stale
  useEffect(() => {
    if (marketsLoading) {
      setIsLoading(true);
      return;
    }

    if (isCacheStale() || stats.lastUpdated === 0) {
      console.log('🔄 StatsCache: Updating stats (cache stale or first load)');
      const newStats = calculateStats();
      setStats(newStats);
      setIsStale(false);
    } else {
      console.log('✅ StatsCache: Using cached stats');
      setIsStale(false);
    }
    
    setIsLoading(false);
  }, [allMarkets, dbStats, marketsLoading, isCacheStale, calculateStats, stats.lastUpdated]);

  // Force refresh function
  const refreshStats = useCallback(() => {
    console.log('🔄 StatsCache: Force refreshing stats');
    const newStats = calculateStats();
    setStats(newStats);
    setIsStale(false);
  }, [calculateStats]);

  return {
    stats,
    isLoading,
    isStale,
    refreshStats
  };
}
