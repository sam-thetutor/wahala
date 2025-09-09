import { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { PREDICTION_MARKET_CORE_ABI, PREDICTION_MARKET_CLAIMS_ABI } from '@/contracts/contracts';
import { usePredictionMarket } from './usePredictionMarket';
import { formatEther, parseEther } from 'viem';
import { getCoreContractAddress, getClaimsContractAddress } from '@/lib/contract-addresses';

interface TradingState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  selectedOutcome: boolean | null; // true for YES, false for NO
  amount: string;
  estimatedShares: string;
  estimatedPrice: string;
}

interface UserParticipation {
  participated: boolean;
  side: boolean; // true for YES, false for NO
  yesShares: bigint;
  noShares: bigint;
}

interface WinnerInfo {
  isWinner: boolean;
  winnings: bigint;
  hasClaimed: boolean;
}

interface WinningsBreakdown {
  userShares: bigint;
  totalWinningShares: bigint;
  totalLosingShares: bigint;
  userWinnings: bigint;
  hasLosingShares: boolean;
}

export function useMarketTrading(marketId: number) {
  const { address } = useAccount();
  const { buyShares, claimWinnings, contractState } = usePredictionMarket();
  
  const [tradingState, setTradingState] = useState<TradingState>({
    isLoading: false,
    error: null,
    success: false,
    selectedOutcome: null,
    amount: '',
    estimatedShares: '0',
    estimatedPrice: '0'
  });

  // Get market data
  const { data: market, isLoading: marketLoading, error: marketError } = useReadContract({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)],
    chainId: 42220
  });

  // Get user participation
  const { data: participation, isLoading: participationLoading } = useReadContract({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI,
    functionName: 'getUserParticipation',
    args: [BigInt(marketId), address || '0x0'],
    chainId: 42220,
    query: {
      enabled: !!address
    }
  });

  // Get user winnings
  const { data: winnings, isLoading: winningsLoading } = useReadContract({
    address: getClaimsContractAddress(),
    abi: PREDICTION_MARKET_CLAIMS_ABI,
    functionName: 'calculateUserWinnings',
    args: [BigInt(marketId), address || '0x0'],
    chainId: 42220,
    query: {
      enabled: !!address
    }
  });

  // Get winner info
  const { data: winnerInfo, isLoading: winnerInfoLoading } = useReadContract({
    address: getClaimsContractAddress(),
    abi: PREDICTION_MARKET_CLAIMS_ABI,
    functionName: 'isWinner',
    args: [BigInt(marketId), address || '0x0'],
    chainId: 42220,
    query: {
      enabled: !!address
    }
  });

  // Get winnings breakdown
  const { data: winningsBreakdown, isLoading: breakdownLoading } = useReadContract({
    address: getClaimsContractAddress(),
    abi: PREDICTION_MARKET_CLAIMS_ABI,
    functionName: 'getWinningsBreakdown',
    args: [BigInt(marketId), address || '0x0'],
    chainId: 42220,
    query: {
      enabled: !!address
    }
  });

  // Calculate estimated shares and price
  useEffect(() => {
    if (!market || !tradingState.amount || tradingState.selectedOutcome === null) {
      setTradingState(prev => ({ 
        ...prev, 
        estimatedShares: '0', 
        estimatedPrice: '0' 
      }));
      return;
    }

    try {
      const amountWei = parseEther(tradingState.amount);
      const totalYes = (market as any).totalYes || BigInt(0);
      const totalNo = (market as any).totalNo || BigInt(0);
      const totalPool = (market as any).totalPool || BigInt(0);

      // Calculate estimated shares (simplified - in reality this would be more complex)
      const estimatedShares = amountWei; // 1:1 for simplicity
      const estimatedPrice = tradingState.selectedOutcome 
        ? formatEther(totalYes > BigInt(0) ? (amountWei * totalYes) / totalPool : amountWei)
        : formatEther(totalNo > BigInt(0) ? (amountWei * totalNo) / totalPool : amountWei);

      setTradingState(prev => ({
        ...prev,
        estimatedShares: formatEther(estimatedShares),
        estimatedPrice
      }));
    } catch (error) {
      console.error('Error calculating estimates:', error);
    }
  }, [market, tradingState.amount, tradingState.selectedOutcome]);

  // Update trading state
  const updateTradingState = useCallback((updates: Partial<TradingState>) => {
    setTradingState(prev => ({ ...prev, ...updates }));
  }, []);

  // Set selected outcome
  const setSelectedOutcome = useCallback((outcome: boolean) => {
    updateTradingState({ selectedOutcome: outcome });
  }, [updateTradingState]);

  // Set amount
  const setAmount = useCallback((amount: string) => {
    updateTradingState({ amount });
  }, [updateTradingState]);

  // Buy shares
  const buySharesHandler = useCallback(async () => {
    if (!tradingState.selectedOutcome || !tradingState.amount) {
      updateTradingState({ error: 'Please select an outcome and enter an amount' });
      return;
    }

    if (!address) {
      updateTradingState({ error: 'Wallet not connected' });
      return;
    }

    updateTradingState({ isLoading: true, error: null, success: false });

    try {
      const result = await buyShares({
        marketId,
        outcome: tradingState.selectedOutcome,
        amount: tradingState.amount
      });

      if (result.success) {
        updateTradingState({ 
          isLoading: false, 
          success: true, 
          amount: '',
          selectedOutcome: null 
        });
      } else {
        updateTradingState({ 
          isLoading: false, 
          error: result.error || 'Failed to buy shares' 
        });
      }
    } catch (error: any) {
      updateTradingState({ 
        isLoading: false, 
        error: error.message || 'Failed to buy shares' 
      });
    }
  }, [tradingState.selectedOutcome, tradingState.amount, address, marketId, buyShares, updateTradingState]);

  // Claim winnings
  const claimWinningsHandler = useCallback(async () => {
    if (!address) {
      updateTradingState({ error: 'Wallet not connected' });
      return;
    }

    updateTradingState({ isLoading: true, error: null, success: false });

    try {
      const result = await claimWinnings(marketId);

      if (result.success) {
        updateTradingState({ 
          isLoading: false, 
          success: true 
        });
      } else {
        updateTradingState({ 
          isLoading: false, 
          error: result.error || 'Failed to claim winnings' 
        });
      }
    } catch (error: any) {
      updateTradingState({ 
        isLoading: false, 
        error: error.message || 'Failed to claim winnings' 
      });
    }
  }, [address, marketId, claimWinnings, updateTradingState]);

  // Clear error
  const clearError = useCallback(() => {
    updateTradingState({ error: null });
  }, [updateTradingState]);

  // Reset state
  const resetState = useCallback(() => {
    updateTradingState({
      isLoading: false,
      error: null,
      success: false,
      selectedOutcome: null,
      amount: '',
      estimatedShares: '0',
      estimatedPrice: '0'
    });
  }, [updateTradingState]);

  // Process participation data
  const userParticipation: UserParticipation | null = participation ? {
    participated: (participation as any)[0] || false,
    side: (participation as any)[1] || false,
    yesShares: (participation as any)[2] || BigInt(0),
    noShares: (participation as any)[3] || BigInt(0)
  } : null;

  // Process winner info
  const winnerInfoProcessed: WinnerInfo | null = winnerInfo !== undefined ? {
    isWinner: winnerInfo as boolean,
    winnings: (winnings as bigint) || BigInt(0),
    hasClaimed: false // This would need to be fetched separately
  } : null;

  // Process winnings breakdown
  const winningsBreakdownProcessed: WinningsBreakdown | null = winningsBreakdown ? {
    userShares: (winningsBreakdown as any)[0] || BigInt(0),
    totalWinningShares: (winningsBreakdown as any)[1] || BigInt(0),
    totalLosingShares: (winningsBreakdown as any)[2] || BigInt(0),
    userWinnings: (winningsBreakdown as any)[3] || BigInt(0),
    hasLosingShares: (winningsBreakdown as any)[4] || false
  } : null;

  return {
    // Market data
    market,
    marketLoading,
    marketError,
    
    // Trading state
    tradingState,
    setSelectedOutcome,
    setAmount,
    buyShares: buySharesHandler,
    
    // User data
    userParticipation,
    participationLoading,
    winnerInfo: winnerInfoProcessed,
    winnerInfoLoading,
    winnings: winnings || BigInt(0),
    winningsLoading,
    winningsBreakdown: winningsBreakdownProcessed,
    breakdownLoading,
    
    // Claims
    claimWinnings: claimWinningsHandler,
    
    // State management
    clearError,
    resetState,
    
    // Contract state
    contractState
  };
}
