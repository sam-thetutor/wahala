'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { subgraphClient, queries, SubgraphUserClaim, subgraphApi } from '@/lib/subgraph';
import { formatEther, parseEther } from 'viem';

export interface WinningsClaim {
  marketId: string;
  marketQuestion: string;
  marketDescription: string;
  userShares: string; // YES or NO shares
  winningSide: boolean; // true if YES won, false if NO won
  claimableAmount: string; // CELO amount
  isClaimed: boolean;
  resolvedAt: string;
  totalPool: string;
  totalYes: string;
  totalNo: string;
}

export interface CreatorFeeClaim {
  marketId: string;
  marketQuestion: string;
  marketDescription: string;
  creatorFee: string; // CELO amount
  isClaimed: boolean;
  resolvedAt: string;
  totalPool: string;
  totalYes: string;
  totalNo: string;
}

export interface ClaimsData {
  winnings: WinningsClaim[];
  creatorFees: CreatorFeeClaim[];
  totalClaimableWinnings: string;
  totalClaimableCreatorFees: string;
  totalClaimed: string;
}

// Helper function that matches the contract's _calculateTotalWinnerAmount function
const calculateTotalWinnerAmount = (winningShares: number, losingShares: number, creatorFeePercentage: number = 5): number => {
  if (losingShares === 0) return winningShares;
  
  const creatorFee = (losingShares * creatorFeePercentage) / 100;
  const platformFee = (losingShares * 15) / 100; // 15% platform fee
  const winnersFromLosers = losingShares - creatorFee - platformFee;
  
  return winningShares + winnersFromLosers;
};

export function useClaims(userAddress: string | undefined) {
  const [claimsData, setClaimsData] = useState<ClaimsData>({
    winnings: [],
    creatorFees: [],
    totalClaimableWinnings: '0',
    totalClaimableCreatorFees: '0',
    totalClaimed: '0'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClaimsData = useCallback(async () => {
    if (!userAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching claims data for user:', userAddress);
      
      const response = await subgraphClient.query(queries.getUserClaims, {
        userAddress: userAddress.toLowerCase()
      });

      console.log('🔍 Raw claims response:', response);

      if (response.data) {
        const data: SubgraphUserClaim = response.data;
        
        // Process winnings claims
        const winnings: WinningsClaim[] = [];
        
        for (const participation of data.participants) {
          const market = participation.market;
          if (market.status === 'RESOLVED' && market.outcome !== null) {
            const userYesShares = parseFloat(participation.totalYesShares);
            const userNoShares = parseFloat(participation.totalNoShares);
            const totalYes = parseFloat(market.totalYes);
            const totalNo = parseFloat(market.totalNo);
            const totalPool = parseFloat(market.totalPool);
            
            // Determine if user has winning shares
            const hasWinningShares = market.outcome ? userYesShares > 0 : userNoShares > 0;
            const userShares = market.outcome ? participation.totalYesShares : participation.totalNoShares;
            
            // Calculate claimable amount using the exact same formula as the contract
            let claimableAmount = '0';
            if (hasWinningShares) {
              // Convert from wei to CELO for calculations
              const userWinningShares = parseFloat(formatEther(BigInt(userShares)));
              const totalWinningShares = market.outcome ? parseFloat(formatEther(BigInt(market.totalYes))) : parseFloat(formatEther(BigInt(market.totalNo)));
              const totalLosingShares = market.outcome ? parseFloat(formatEther(BigInt(market.totalNo))) : parseFloat(formatEther(BigInt(market.totalYes)));
              
              // Calculate total winner amount using the exact same formula as the contract
              // This matches the _calculateTotalWinnerAmount function in PredictionMarketClaims.sol
              const totalWinnerAmount = calculateTotalWinnerAmount(totalWinningShares, totalLosingShares, 5);
              
              // User's proportional share of the total winner amount
              // This matches the final calculation in calculateUserWinnings function
              claimableAmount = ((totalWinnerAmount * userWinningShares) / totalWinningShares).toString();
              
              console.log('🎯 Winnings calculation for market', market.id, ':', {
                userWinningShares,
                totalWinningShares,
                totalLosingShares,
                totalWinnerAmount,
                claimableAmount,
                marketOutcome: market.outcome
              });
            }

            // Check if user has already claimed winnings using subgraph
            const isClaimed = await subgraphApi.checkUserClaimedWinnings(userAddress.toLowerCase(), market.id);

            if (parseFloat(claimableAmount) > 0) {
              winnings.push({
                marketId: market.id,
                marketQuestion: market.question,
                marketDescription: market.description,
                userShares: hasWinningShares ? parseFloat(formatEther(BigInt(userShares))).toString() : '0',
                winningSide: market.outcome!,
                claimableAmount,
                isClaimed,
                resolvedAt: market.resolvedAt,
                totalPool: parseFloat(formatEther(BigInt(market.totalPool))).toString(),
                totalYes: parseFloat(formatEther(BigInt(market.totalYes))).toString(),
                totalNo: parseFloat(formatEther(BigInt(market.totalNo))).toString()
              });
            }
          }
        }

        // Process creator fee claims
        const creatorFees: CreatorFeeClaim[] = [];
        
        for (const market of data.markets) {
          if (market.status === 'RESOLVED') {
            // Calculate creator fee using the exact same formula as the contract
            // This matches the calculation in calculateWinners function in PredictionMarketClaims.sol
            const totalYes = parseFloat(formatEther(BigInt(market.totalYes)));
            const totalNo = parseFloat(formatEther(BigInt(market.totalNo)));
            
            // Creator fee is calculated from the losing shares, not total pool
            const losingShares = market.outcome ? totalNo : totalYes;
            const creatorFeePercentage = 5; // 5% creator fee (should match contract)
            const creatorFee = (losingShares * creatorFeePercentage / 100).toString();
            
            console.log('💰 Creator fee calculation for market', market.id, ':', {
              totalYes,
              totalNo,
              marketOutcome: market.outcome,
              losingShares,
              creatorFeePercentage,
              creatorFee
            });

            // Check if user has already claimed creator fee using subgraph
            // Note: Creator fee claims are tracked separately, we'll need to add this to subgraph
            const isClaimed = false; // TODO: Add creator fee claims tracking to subgraph

            if (parseFloat(creatorFee) > 0) {
              creatorFees.push({
                marketId: market.id,
                marketQuestion: market.question,
                marketDescription: market.description,
                creatorFee,
                isClaimed,
                resolvedAt: market.resolvedAt,
                totalPool: (totalYes + totalNo).toString(),
                totalYes: parseFloat(formatEther(BigInt(market.totalYes))).toString(),
                totalNo: parseFloat(formatEther(BigInt(market.totalNo))).toString()
              });
            }
          }
        }

        // Calculate totals
        const totalClaimableWinnings = winnings.reduce((sum, claim) => 
          sum + parseFloat(claim.claimableAmount), 0
        ).toString();

        const totalClaimableCreatorFees = creatorFees.reduce((sum, claim) => 
          sum + parseFloat(claim.creatorFee), 0
        ).toString();

        const totalClaimed = '0'; // This would need to be tracked separately

        setClaimsData({
          winnings,
          creatorFees,
          totalClaimableWinnings,
          totalClaimableCreatorFees,
          totalClaimed
        });

        console.log('✅ Processed claims data:', {
          winningsCount: winnings.length,
          creatorFeesCount: creatorFees.length,
          totalClaimableWinnings,
          totalClaimableCreatorFees
        });
      }
    } catch (err) {
      console.error('❌ Error fetching claims data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch claims data');
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchClaimsData();
  }, [fetchClaimsData]);

  const refetch = useCallback(() => {
    fetchClaimsData();
  }, [fetchClaimsData]);

  return {
    ...claimsData,
    loading,
    error,
    refetch
  };
}
