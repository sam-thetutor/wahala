'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { subgraphApi, SubgraphUserClaimsAndWinnings } from '@/lib/subgraph';
import { formatEther } from 'viem';

export interface UserClaim {
  id: string;
  type: 'winnings' | 'creator_fee';
  marketId: string;
  marketQuestion: string;
  marketOutcome?: boolean;
  amount: string;
  claimedAt: number;
  transactionHash: string;
  status: 'claimed' | 'available' | 'pending';
}

export interface AvailableClaim {
  marketId: string;
  marketQuestion: string;
  marketOutcome?: boolean;
  winningsAmount: string;
  creatorFeeAmount: string;
  totalAmount: string;
  canClaim: boolean;
  reason?: string;
}

interface UseSubgraphUserClaimsReturn {
  claims: UserClaim[];
  availableClaims: AvailableClaim[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  stats: {
    totalClaimed: string;
    totalAvailable: string;
    totalWinningsClaimed: string;
    totalCreatorFeesClaimed: string;
    pendingClaims: number;
    claimableMarkets: number;
  };
}

export function useSubgraphUserClaims(): UseSubgraphUserClaimsReturn {
  const { address } = useAccount();
  const [claims, setClaims] = useState<UserClaim[]>([]);
  const [availableClaims, setAvailableClaims] = useState<AvailableClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAvailableClaims = useCallback((data: SubgraphUserClaimsAndWinnings): AvailableClaim[] => {
    const { participants, winningsClaimeds, creatorFeeClaimeds } = data;
    
    // Group claims by market ID
    const claimedWinningsByMarket = new Map<string, number>();
    const claimedCreatorFeesByMarket = new Map<string, number>();
    
    winningsClaimeds.forEach(claim => {
      const amount = parseFloat(formatEther(BigInt(claim.amount)));
      claimedWinningsByMarket.set(claim.marketId, amount);
    });
    
    creatorFeeClaimeds.forEach(claim => {
      const amount = parseFloat(formatEther(BigInt(claim.amount)));
      claimedCreatorFeesByMarket.set(claim.marketId, amount);
    });
    
    // Calculate available claims for each market
    const available: AvailableClaim[] = [];
    
    participants.forEach(participation => {
      const market = participation.market;
      
      // Only process resolved markets
      if (market.status !== 'RESOLVED' || market.outcome === undefined) {
        return;
      }
      
      const marketId = market.id;
      const totalYes = parseFloat(formatEther(BigInt(market.totalYes)));
      const totalNo = parseFloat(formatEther(BigInt(market.totalNo)));
      const totalPool = parseFloat(formatEther(BigInt(market.totalPool)));
      
      // Calculate user's winning shares
      const userYesShares = parseFloat(formatEther(BigInt(participation.totalYesShares)));
      const userNoShares = parseFloat(formatEther(BigInt(participation.totalNoShares)));
      
      let winningsAmount = 0;
      let creatorFeeAmount = 0;
      
      if (market.outcome === true && userYesShares > 0) {
        // User won with YES shares
        const totalLosingShares = totalNo;
        const creatorFee = totalLosingShares * 0.15; // 15% creator fee
        const platformFee = totalLosingShares * 0.15; // 15% platform fee
        const winningsFromLosers = totalLosingShares - creatorFee - platformFee;
        const totalWinnerAmount = totalYes + winningsFromLosers;
        winningsAmount = (totalWinnerAmount * userYesShares) / totalYes;
        
        // Creator fee (if user is the creator)
        if (participation.market.creator === address) {
          creatorFeeAmount = creatorFee;
        }
      } else if (market.outcome === false && userNoShares > 0) {
        // User won with NO shares
        const totalLosingShares = totalYes;
        const creatorFee = totalLosingShares * 0.15; // 15% creator fee
        const platformFee = totalLosingShares * 0.15; // 15% platform fee
        const winningsFromLosers = totalLosingShares - creatorFee - platformFee;
        const totalWinnerAmount = totalNo + winningsFromLosers;
        winningsAmount = (totalWinnerAmount * userNoShares) / totalNo;
        
        // Creator fee (if user is the creator)
        if (participation.market.creator === address) {
          creatorFeeAmount = creatorFee;
        }
      }
      
      // Check if already claimed
      const claimedWinnings = claimedWinningsByMarket.get(marketId) || 0;
      const claimedCreatorFees = claimedCreatorFeesByMarket.get(marketId) || 0;
      
      const availableWinnings = Math.max(0, winningsAmount - claimedWinnings);
      const availableCreatorFees = Math.max(0, creatorFeeAmount - claimedCreatorFees);
      const totalAvailable = availableWinnings + availableCreatorFees;
      
      if (totalAvailable > 0) {
        available.push({
          marketId,
          marketQuestion: market.question,
          marketOutcome: market.outcome,
          winningsAmount: availableWinnings.toString(),
          creatorFeeAmount: availableCreatorFees.toString(),
          totalAmount: totalAvailable.toString(),
          canClaim: true,
          reason: totalAvailable > 0 ? 'Winnings available' : 'Already claimed'
        });
      }
    });
    
    return available;
  }, [address]);

  const fetchClaims = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const data = await subgraphApi.getUserClaimsAndWinnings(address);
      
      // Create a map of market data for quick lookup
      const marketMap = new Map();
      data.participants.forEach(p => {
        marketMap.set(p.market.id, p.market);
      });
      
      // Transform claimed winnings
      const winningsClaims: UserClaim[] = data.winningsClaimeds.map(claim => {
        const market = marketMap.get(claim.marketId);
        return {
          id: claim.id,
          type: 'winnings',
          marketId: claim.marketId,
          marketQuestion: market?.question || 'Unknown Market',
          marketOutcome: market?.outcome,
          amount: formatEther(BigInt(claim.amount)),
          claimedAt: parseInt(claim.blockTimestamp),
          transactionHash: claim.transactionHash,
          status: 'claimed' as const
        };
      });
      
      // Transform claimed creator fees
      const creatorFeeClaims: UserClaim[] = data.creatorFeeClaimeds.map(claim => {
        const market = marketMap.get(claim.marketId);
        return {
          id: claim.id,
          type: 'creator_fee',
          marketId: claim.marketId,
          marketQuestion: market?.question || 'Unknown Market',
          marketOutcome: market?.outcome,
          amount: formatEther(BigInt(claim.amount)),
          claimedAt: parseInt(claim.blockTimestamp),
          transactionHash: claim.transactionHash,
          status: 'claimed' as const
        };
      });
      
      // Combine all claims and sort by date
      const allClaims = [...winningsClaims, ...creatorFeeClaims]
        .sort((a, b) => b.claimedAt - a.claimedAt);
      
      setClaims(allClaims);
      
      // Calculate available claims
      const available = calculateAvailableClaims(data);
      setAvailableClaims(available);
      
    } catch (err) {
      console.error('Error fetching user claims:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user claims');
    } finally {
      setLoading(false);
    }
  }, [address, calculateAvailableClaims]);

  const refetch = useCallback(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Calculate stats
  const stats = {
    totalClaimed: claims
      .filter(c => c.status === 'claimed')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0)
      .toString(),
    totalAvailable: availableClaims
      .reduce((sum, c) => sum + parseFloat(c.totalAmount), 0)
      .toString(),
    totalWinningsClaimed: claims
      .filter(c => c.type === 'winnings' && c.status === 'claimed')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0)
      .toString(),
    totalCreatorFeesClaimed: claims
      .filter(c => c.type === 'creator_fee' && c.status === 'claimed')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0)
      .toString(),
    pendingClaims: availableClaims.length,
    claimableMarkets: availableClaims.filter(c => c.canClaim).length
  };

  // Initial fetch
  useEffect(() => {
    if (address) {
      fetchClaims();
    }
  }, [address, fetchClaims]);

  return {
    claims,
    availableClaims,
    loading,
    error,
    refetch,
    stats
  };
}
