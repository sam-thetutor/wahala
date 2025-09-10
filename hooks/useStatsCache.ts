import { useMemo } from 'react';
import { useSubgraphMarkets } from './useSubgraphMarkets';

interface StatsData {
  totalMarkets: number;
  activeTraders: number;
  totalVolume: bigint;
  marketsResolved: number;
  lastUpdated: number;
}

export function useStatsCache() {
  const { markets: allMarkets, loading } = useSubgraphMarkets();
  
  // Calculate stats from subgraph data
  const stats = useMemo(() => {
    if (!allMarkets || allMarkets.length === 0) {
      return {
        totalMarkets: 0,
        activeTraders: 0,
        totalVolume: 0n,
        marketsResolved: 0,
        lastUpdated: Date.now()
      };
    }
    
    const totalMarkets = allMarkets.length;
    const marketsResolved = allMarkets.filter(market => market.status === 'RESOLVED').length;
    const totalVolume = allMarkets.reduce((sum, market) => {
      return sum + BigInt(Math.floor(parseFloat(market.totalPool) * 1e18));
    }, 0n);
    
    return {
      totalMarkets,
      activeTraders: totalMarkets, // Placeholder - would need participants data
      totalVolume,
      marketsResolved,
      lastUpdated: Date.now()
    };
  }, [allMarkets]);

  return {
    stats,
    loading,
    isStale: false, // Subgraph data is always fresh
    refresh: () => {}, // No manual refresh needed
    getStatus: () => 'idle' // No polling status
  };
}