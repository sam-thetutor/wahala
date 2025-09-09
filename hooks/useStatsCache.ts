import { useState, useEffect, useCallback } from 'react';
import { useAllMarketsApi } from './useMarketsApi';
import { useEventsStore } from '@/stores/eventsStore';
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
  const { logs, fetchAllLogs, isLoading: logsLoading } = useEventsStore();

  // Check if cache is stale
  const isCacheStale = useCallback(() => {
    return Date.now() - stats.lastUpdated > CACHE_DURATION;
  }, [stats.lastUpdated]);

  // Calculate stats
  const calculateStats = useCallback(() => {
    console.log('🔍 StatsCache: Calculating stats...', { 
      allMarketsLength: allMarkets.length,
      dbStats,
      logsLength: logs.length,
      marketsLoading,
      logsLoading
    });
    
    // Use database stats as base
    let totalMarketsCount = dbStats.totalMarkets;
    let marketsResolved = dbStats.resolvedMarkets;
    let totalVolume = BigInt(dbStats.totalVolume || '0');
    
    console.log('📊 Database stats:', {
      totalMarkets: totalMarketsCount,
      marketsResolved,
      totalVolume: formatEther(totalVolume),
      marketsWithData: allMarkets.filter(m => m.question && m.question.length > 0).length,
      marketsWithVolume: allMarkets.filter(m => BigInt(m.totalpool) > 0n).length
    });
    
    // If volume is 0 and we have events, try calculating from trading events
    if (totalVolume === 0n && logs.length > 0) {
      const sharesBoughtEvents = logs.filter(log => log.eventName === 'SharesBought');
      const marketCreatedEvents = logs.filter(log => log.eventName === 'MarketCreated');
      
      // Calculate trading volume
      const tradingVolume = sharesBoughtEvents.reduce((sum, event) => {
        const amount = event.args?.amount || 0n;
        return sum + BigInt(amount);
      }, 0n);
      
      // Calculate creation fees volume
      const creationFeesVolume = marketCreatedEvents.reduce((sum, event) => {
        const fee = event.args?.creationFee || 0n;
        return sum + BigInt(fee);
      }, 0n);
      
      totalVolume = tradingVolume + creationFeesVolume;
      console.log('📊 Calculated volume from events:', {
        tradingVolume: formatEther(tradingVolume),
        creationFees: formatEther(creationFeesVolume),
        totalVolume: formatEther(totalVolume)
      });
    }

    // Count unique active traders
    const uniqueTraders = new Set<string>();
    
    // Add all market creators
    allMarkets.forEach(market => {
      if (market.creator && market.creator !== '0x0') {
        uniqueTraders.add(market.creator.toLowerCase());
      }
    });
    
    // Add traders from events if available
    const tradingEvents = logs.filter(log => 
      log.eventName === 'SharesBought' || 
      log.eventName === 'MarketCreated' ||
      log.eventName === 'WinningsClaimed'
    );

    tradingEvents.forEach(event => {
      const args = event.args || {};
      
      if (args.creator) {
        uniqueTraders.add(args.creator.toLowerCase());
      }
      if (args.buyer) {
        uniqueTraders.add(args.buyer.toLowerCase());
      }
      if (args.claimant) {
        uniqueTraders.add(args.claimant.toLowerCase());
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
  }, [allMarkets, dbStats, logs, marketsLoading, logsLoading]);

  // Update stats when data changes or cache is stale
  useEffect(() => {
    if (marketsLoading || logsLoading) {
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
  }, [allMarkets, dbStats, logs, marketsLoading, logsLoading, isCacheStale, calculateStats, stats.lastUpdated]);

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
