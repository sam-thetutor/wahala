'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { subgraphApi, SubgraphUserTradingPerformance } from '@/lib/subgraph';
import { formatEther } from 'viem';

export interface PerformanceMetrics {
  // Basic performance
  totalReturn: number; // in CELO
  totalReturnPercentage: number;
  roi: number;
  
  // Risk metrics
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  var95: number; // Value at Risk (95% confidence)
  
  // Trading patterns
  averageHoldingPeriod: number; // in days
  tradingFrequency: number; // trades per day
  winStreak: number;
  lossStreak: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';
  
  // Market analysis
  preferredSide: 'Yes' | 'No' | 'Balanced';
  sideAccuracy: {
    yes: number;
    no: number;
    overall: number;
  };
  
  // Time-based performance
  dailyReturns: Array<{
    date: string;
    return: number;
    cumulative: number;
  }>;
  
  monthlyReturns: Array<{
    month: string;
    return: number;
    trades: number;
  }>;
  
  // Market performance by category (if available)
  marketPerformance: Array<{
    marketId: string;
    question: string;
    outcome: boolean;
    userSide: 'Yes' | 'No';
    investment: number;
    return: number;
    returnPercentage: number;
    holdingPeriod: number;
  }>;
  
  // Risk-adjusted metrics
  calmarRatio: number;
  sortinoRatio: number;
  informationRatio: number;
  
  // Behavioral metrics
  overconfidence: number; // 0-1 scale
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  tradingStyle: 'Scalper' | 'Swing' | 'Position' | 'Mixed';
}

interface UseSubgraphUserPerformanceReturn {
  performance: PerformanceMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: number | null;
}

export function useSubgraphUserPerformance(): UseSubgraphUserPerformanceReturn {
  const { address } = useAccount();
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const calculatePerformance = useCallback((data: SubgraphUserTradingPerformance): PerformanceMetrics => {
    const { participants, sharesBoughts } = data;
    
    // Filter resolved markets only
    const resolvedMarkets = participants.filter(p => 
      p.market.status === 'RESOLVED' && p.market.outcome !== undefined
    );
    
    // Calculate basic performance
    const totalInvestment = resolvedMarkets.reduce((sum, p) => 
      sum + parseFloat(formatEther(BigInt(p.totalInvestment))), 0
    );
    
    const totalWinnings = resolvedMarkets.reduce((sum, p) => {
      const market = p.market;
      const userYesShares = parseFloat(formatEther(BigInt(p.totalYesShares)));
      const userNoShares = parseFloat(formatEther(BigInt(p.totalNoShares)));
      
      if (market.outcome === true && userYesShares > 0) {
        // User won with YES shares
        const totalYes = parseFloat(formatEther(BigInt(market.totalYes)));
        const totalNo = parseFloat(formatEther(BigInt(market.totalNo)));
        const totalLosingShares = totalNo;
        const creatorFee = totalLosingShares * 0.15;
        const platformFee = totalLosingShares * 0.15;
        const winningsFromLosers = totalLosingShares - creatorFee - platformFee;
        const totalWinnerAmount = totalYes + winningsFromLosers;
        return sum + (totalWinnerAmount * userYesShares) / totalYes;
      } else if (market.outcome === false && userNoShares > 0) {
        // User won with NO shares
        const totalYes = parseFloat(formatEther(BigInt(market.totalYes)));
        const totalNo = parseFloat(formatEther(BigInt(market.totalNo)));
        const totalLosingShares = totalYes;
        const creatorFee = totalLosingShares * 0.15;
        const platformFee = totalLosingShares * 0.15;
        const winningsFromLosers = totalLosingShares - creatorFee - platformFee;
        const totalWinnerAmount = totalNo + winningsFromLosers;
        return sum + (totalWinnerAmount * userNoShares) / totalNo;
      }
      return sum;
    }, 0);
    
    const totalReturn = totalWinnings - totalInvestment;
    const totalReturnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
    const roi = totalReturnPercentage;
    
    // Calculate individual market performance
    const marketPerformance = resolvedMarkets.map(p => {
      const market = p.market;
      const investment = parseFloat(formatEther(BigInt(p.totalInvestment)));
      const userYesShares = parseFloat(formatEther(BigInt(p.totalYesShares)));
      const userNoShares = parseFloat(formatEther(BigInt(p.totalNoShares)));
      
      let winnings = 0;
      let userSide: 'Yes' | 'No' = 'No';
      
      if (market.outcome === true && userYesShares > 0) {
        userSide = 'Yes';
        const totalYes = parseFloat(formatEther(BigInt(market.totalYes)));
        const totalNo = parseFloat(formatEther(BigInt(market.totalNo)));
        const totalLosingShares = totalNo;
        const creatorFee = totalLosingShares * 0.15;
        const platformFee = totalLosingShares * 0.15;
        const winningsFromLosers = totalLosingShares - creatorFee - platformFee;
        const totalWinnerAmount = totalYes + winningsFromLosers;
        winnings = (totalWinnerAmount * userYesShares) / totalYes;
      } else if (market.outcome === false && userNoShares > 0) {
        userSide = 'No';
        const totalYes = parseFloat(formatEther(BigInt(market.totalYes)));
        const totalNo = parseFloat(formatEther(BigInt(market.totalNo)));
        const totalLosingShares = totalYes;
        const creatorFee = totalLosingShares * 0.15;
        const platformFee = totalLosingShares * 0.15;
        const winningsFromLosers = totalLosingShares - creatorFee - platformFee;
        const totalWinnerAmount = totalNo + winningsFromLosers;
        winnings = (totalWinnerAmount * userNoShares) / totalNo;
      }
      
      const returnAmount = winnings - investment;
      const returnPercentage = investment > 0 ? (returnAmount / investment) * 100 : 0;
      
      // Calculate holding period
      const firstPurchase = parseInt(p.firstPurchaseAt);
      const lastPurchase = parseInt(p.lastPurchaseAt);
      const holdingPeriod = (lastPurchase - firstPurchase) / (24 * 60 * 60); // days
      
      return {
        marketId: market.id,
        question: market.question,
        outcome: market.outcome!,
        userSide,
        investment,
        return: returnAmount,
        returnPercentage,
        holdingPeriod: Math.round(holdingPeriod * 100) / 100
      };
    });
    
    // Calculate daily returns
    const dailyReturns: Array<{ date: string; return: number; cumulative: number }> = [];
    const returnsByDate = new Map<string, number>();
    
    marketPerformance.forEach(mp => {
      const date = new Date(parseInt(mp.marketId) * 1000).toISOString().split('T')[0];
      const existing = returnsByDate.get(date) || 0;
      returnsByDate.set(date, existing + mp.return);
    });
    
    let cumulative = 0;
    Array.from(returnsByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, returnAmount]) => {
        cumulative += returnAmount;
        dailyReturns.push({
          date,
          return: returnAmount,
          cumulative
        });
      });
    
    // Calculate monthly returns
    const monthlyReturns: Array<{ month: string; return: number; trades: number }> = [];
    const returnsByMonth = new Map<string, { return: number; trades: number }>();
    
    marketPerformance.forEach(mp => {
      const date = new Date(parseInt(mp.marketId) * 1000);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = returnsByMonth.get(month) || { return: 0, trades: 0 };
      returnsByMonth.set(month, {
        return: existing.return + mp.return,
        trades: existing.trades + 1
      });
    });
    
    Array.from(returnsByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, data]) => {
        monthlyReturns.push({
          month,
          return: data.return,
          trades: data.trades
        });
      });
    
    // Calculate volatility (standard deviation of daily returns)
    const returns = dailyReturns.map(r => r.return);
    const meanReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
    const variance = returns.length > 0 ? 
      returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length : 0;
    const volatility = Math.sqrt(variance);
    
    // Calculate Sharpe ratio (simplified - assumes risk-free rate of 0)
    const sharpeRatio = volatility > 0 ? meanReturn / volatility : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    dailyReturns.forEach(r => {
      if (r.cumulative > peak) {
        peak = r.cumulative;
      }
      const drawdown = peak - r.cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    // Calculate Value at Risk (95% confidence)
    const sortedReturns = returns.sort((a, b) => a - b);
    const varIndex = Math.floor(sortedReturns.length * 0.05);
    const var95 = sortedReturns[varIndex] || 0;
    
    // Calculate streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentStreakType: 'win' | 'loss' | 'none' = 'none';
    
    marketPerformance.forEach(mp => {
      const isWin = mp.return > 0;
      
      if (isWin) {
        if (currentStreakType === 'win' || currentStreakType === 'none') {
          currentStreak++;
          currentStreakType = 'win';
        } else {
          maxLossStreak = Math.max(maxLossStreak, currentStreak);
          currentStreak = 1;
          currentStreakType = 'win';
        }
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else {
        if (currentStreakType === 'loss' || currentStreakType === 'none') {
          currentStreak++;
          currentStreakType = 'loss';
        } else {
          maxWinStreak = Math.max(maxWinStreak, currentStreak);
          currentStreak = 1;
          currentStreakType = 'loss';
        }
        maxLossStreak = Math.max(maxLossStreak, currentStreak);
      }
    });
    
    // Calculate side accuracy
    const yesTrades = marketPerformance.filter(mp => mp.userSide === 'Yes');
    const noTrades = marketPerformance.filter(mp => mp.userSide === 'No');
    
    const yesAccuracy = yesTrades.length > 0 ? 
      yesTrades.filter(mp => mp.outcome === true).length / yesTrades.length : 0;
    const noAccuracy = noTrades.length > 0 ? 
      noTrades.filter(mp => mp.outcome === false).length / noTrades.length : 0;
    const overallAccuracy = marketPerformance.length > 0 ? 
      marketPerformance.filter(mp => 
        (mp.userSide === 'Yes' && mp.outcome === true) || 
        (mp.userSide === 'No' && mp.outcome === false)
      ).length / marketPerformance.length : 0;
    
    // Calculate preferred side
    const totalYesInvestment = marketPerformance
      .filter(mp => mp.userSide === 'Yes')
      .reduce((sum, mp) => sum + mp.investment, 0);
    const totalNoInvestment = marketPerformance
      .filter(mp => mp.userSide === 'No')
      .reduce((sum, mp) => sum + mp.investment, 0);
    
    const preferredSide = totalYesInvestment > totalNoInvestment ? 'Yes' :
                         totalNoInvestment > totalYesInvestment ? 'No' : 'Balanced';
    
    // Calculate average holding period
    const averageHoldingPeriod = marketPerformance.length > 0 ?
      marketPerformance.reduce((sum, mp) => sum + mp.holdingPeriod, 0) / marketPerformance.length : 0;
    
    // Calculate trading frequency
    const tradingDays = new Set(
      sharesBoughts.map(sb => 
        new Date(parseInt(sb.blockTimestamp) * 1000).toDateString()
      )
    ).size;
    const tradingFrequency = tradingDays > 0 ? sharesBoughts.length / tradingDays : 0;
    
    // Calculate risk tolerance
    const riskTolerance = volatility > 10 ? 'Aggressive' :
                         volatility > 5 ? 'Moderate' : 'Conservative';
    
    // Calculate trading style
    const tradingStyle = averageHoldingPeriod < 1 ? 'Scalper' :
                        averageHoldingPeriod < 7 ? 'Swing' :
                        averageHoldingPeriod < 30 ? 'Position' : 'Mixed';
    
    // Calculate overconfidence (simplified)
    const overconfidence = Math.max(0, Math.min(1, (overallAccuracy - 0.5) * 2));
    
    // Calculate additional ratios
    const calmarRatio = maxDrawdown > 0 ? totalReturnPercentage / maxDrawdown : 0;
    const sortinoRatio = 0; // Would need downside deviation calculation
    const informationRatio = 0; // Would need benchmark comparison
    
    return {
      totalReturn,
      totalReturnPercentage,
      roi,
      volatility: Math.round(volatility * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      var95: Math.round(var95 * 100) / 100,
      averageHoldingPeriod: Math.round(averageHoldingPeriod * 100) / 100,
      tradingFrequency: Math.round(tradingFrequency * 100) / 100,
      winStreak: maxWinStreak,
      lossStreak: maxLossStreak,
      currentStreak,
      streakType: currentStreakType,
      preferredSide,
      sideAccuracy: {
        yes: Math.round(yesAccuracy * 100) / 100,
        no: Math.round(noAccuracy * 100) / 100,
        overall: Math.round(overallAccuracy * 100) / 100
      },
      dailyReturns,
      monthlyReturns,
      marketPerformance,
      calmarRatio: Math.round(calmarRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      informationRatio: Math.round(informationRatio * 100) / 100,
      overconfidence: Math.round(overconfidence * 100) / 100,
      riskTolerance,
      tradingStyle
    };
  }, []);

  const fetchPerformance = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const data = await subgraphApi.getUserTradingPerformance(address);
      const calculatedPerformance = calculatePerformance(data);
      
      setPerformance(calculatedPerformance);
      setLastUpdated(Date.now());
      
    } catch (err) {
      console.error('Error fetching user performance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user performance');
    } finally {
      setLoading(false);
    }
  }, [address, calculatePerformance]);

  const refetch = useCallback(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  // Initial fetch
  useEffect(() => {
    if (address) {
      fetchPerformance();
    }
  }, [address, fetchPerformance]);

  return {
    performance,
    loading,
    error,
    refetch,
    lastUpdated
  };
}
