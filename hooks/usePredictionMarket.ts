import { useState, useCallback, useEffect } from 'react';
import { 
  useAccount, 
  useSwitchChain, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useReadContract,
  useSimulateContract
} from 'wagmi';
import { 
  parseEther, 
  formatEther,
  type Address,
  type TransactionReceipt
} from 'viem';
import { PREDICTION_MARKET_CORE_ABI, PREDICTION_MARKET_CLAIMS_ABI } from '@/contracts/contracts';
import { getReferralDataSuffix, submitDivviReferral } from '@/lib/divvi';
import { celo } from 'viem/chains';
import { getCoreContractAddress, getClaimsContractAddress } from '@/lib/contract-addresses';

interface ContractState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  transactionHash?: string;
  receipt?: TransactionReceipt;
}

interface MarketCreationData {
  question: string;
  description: string;
  category: string;
  image: string;
  source: string;
  endTime: number;
}

interface MarketTradingData {
  marketId: number;
  outcome: boolean; // true for YES, false for NO
  amount: string; // ETH amount as string
}

interface MarketResolutionData {
  marketId: number;
  outcome: boolean;
}

interface UsernameData {
  username: string;
}

interface UsernameChangeData {
  newUsername: string;
}

interface UsePredictionMarketReturn {
  contractState: ContractState;
  // Market management
  createMarket: (params: MarketCreationData) => Promise<{ success: boolean; transactionHash?: string; error?: string; marketId?: number }>;
  buyShares: (params: MarketTradingData) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  updateDatabaseAfterPurchase: (params: MarketTradingData, transactionHash: string) => Promise<boolean>;
  resolveMarket: (params: MarketResolutionData) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  // Username management
  setUsername: (params: UsernameData) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  changeUsername: (params: UsernameChangeData) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  // Claims
  claimWinnings: (marketId: number) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  claimCreatorFee: (marketId: number) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  // State management
  clearError: () => void;
  resetState: () => void;
}

export function usePredictionMarket(): UsePredictionMarketReturn {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const [contractState, setContractState] = useState<ContractState>({
    isLoading: false,
    error: null,
    success: false
  });

  const { writeContract, writeContractAsync, isPending, error: writeError } = useWriteContract();
  const { data: hash, isPending: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash: contractState.transactionHash as `0x${string}`,
  });

  // Update contract state when transaction status changes
  useEffect(() => {
    if (isPending) {
      setContractState(prev => ({ ...prev, isLoading: true, error: null }));
    } else if (writeError) {
      setContractState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: writeError.message || 'Transaction failed',
        success: false
      }));
    } else if (isConfirmed && hash) {
      setContractState(prev => ({ 
        ...prev, 
        isLoading: false, 
        success: true,
        receipt: hash
      }));
    }
  }, [isPending, writeError, isConfirmed, hash]);

  // Helper function to handle contract calls
  const handleContractCall = useCallback(async (
    contractAddress: Address,
    abi: any,
    functionName: string,
    args: any[],
    value?: bigint
  ) => {
    try {
      setContractState(prev => ({ ...prev, isLoading: true, error: null, success: false }));
      
      // Use the writeContractAsync function from the hook
      const hash = await writeContractAsync({
        address: contractAddress,
        abi,
        functionName,
        args,
        value,
        chainId: 42220 // Force Celo mainnet
      });
      
      setContractState(prev => ({ 
        ...prev, 
        transactionHash: hash as string,
        isLoading: true 
      }));
      
      return { success: true, transactionHash: hash as string };
    } catch (error: any) {
      const errorMessage = error.message || 'Transaction failed';
      setContractState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage,
        success: false
      }));
      return { success: false, error: errorMessage };
    }
  }, [writeContract]);

  // Market creation
  const createMarket = useCallback(async (params: MarketCreationData) => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Switch to Celo if needed
    if (chainId !== 42220) {
      try {
        await switchChain({ chainId: 42220 });
      } catch (error) {
        return { success: false, error: 'Failed to switch to Celo network' };
      }
    }

    const contractAddress = getCoreContractAddress(42220);
    const result = await handleContractCall(
      contractAddress,
      PREDICTION_MARKET_CORE_ABI,
      'createMarket',
      [params.question, params.description, params.category, params.image, params.source, BigInt(params.endTime)],
      parseEther('0.01') // 0.01 CELO creation fee
    );

    if (result.success) {
      // Submit Divvi referral if available
      try {
        const referralData = getReferralDataSuffix();
        if (referralData && result.transactionHash) {
          await submitDivviReferral(result.transactionHash as `0x${string}`, 42220);
        }
      } catch (error) {
        console.warn('Failed to submit Divvi referral:', error);
      }
    }

    return result;
  }, [address, chainId, switchChain, handleContractCall]);

  // Buy shares
  const buyShares = useCallback(async (params: MarketTradingData) => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (chainId !== 42220) {
      try {
        await switchChain({ chainId: 42220 });
      } catch (error) {
        return { success: false, error: 'Failed to switch to Celo network' };
      }
    }

    const contractAddress = getCoreContractAddress(42220);
    const result = await handleContractCall(
      contractAddress,
      PREDICTION_MARKET_CORE_ABI,
      'buyShares',
      [BigInt(params.marketId), params.outcome],
      parseEther(params.amount)
    );

    return result;
  }, [address, chainId, switchChain, handleContractCall]);

  // Helper function to get market data
  const getMarketData = useCallback(async (marketId: number) => {
    try {
      const response = await fetch(`/api/markets/${marketId}`);
      if (response.ok) {
        const data = await response.json();
        return data.market;
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
    return null;
  }, []);

  // Separate function to update database after transaction confirmation
  const updateDatabaseAfterPurchase = useCallback(async (params: MarketTradingData, transactionHash: string) => {
    try {
      console.log(`🔄 Updating database for confirmed transaction ${transactionHash}...`);
      
      // Fetch current market data to get updated totals
      const marketData = await getMarketData(params.marketId);
      
      if (marketData) {
        // Update market totals
        const updateResponse = await fetch('/api/markets/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            marketId: params.marketId,
            type: 'update_totals',
            data: {
              totalPool: marketData.totalPool,
              totalYes: marketData.totalYes,
              totalNo: marketData.totalNo
            }
          }),
        });

        if (updateResponse.ok) {
          console.log('✅ Market totals updated');
        } else {
          const errorData = await updateResponse.json();
          console.error('❌ Failed to update market totals:', errorData);
        }
      }

      // Update participant data
      const participantResponse = await fetch('/api/markets/update-participant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId: params.marketId,
          address: address,
          outcome: params.outcome,
          amount: params.amount,
          transactionHash: transactionHash
        }),
      });

      if (participantResponse.ok) {
        console.log('✅ Participant data updated');
        return true;
      } else {
        const errorData = await participantResponse.json();
        console.error('❌ Failed to update participant data:', errorData);
        return false;
      }

    } catch (error) {
      console.error('❌ Error updating database:', error);
      return false;
    }
  }, [address, getMarketData]);

  // Resolve market (admin only)
  const resolveMarket = useCallback(async (params: MarketResolutionData) => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (chainId !== 42220) {
      try {
        await switchChain({ chainId: 42220 });
      } catch (error) {
        return { success: false, error: 'Failed to switch to Celo network' };
      }
    }

    const contractAddress = getCoreContractAddress(42220);
    return await handleContractCall(
      contractAddress,
      PREDICTION_MARKET_CORE_ABI,
      'resolveMarket',
      [BigInt(params.marketId), params.outcome]
    );
  }, [address, chainId, switchChain, handleContractCall]);

  // Set username
  const setUsername = useCallback(async (params: UsernameData) => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (chainId !== 42220) {
      try {
        await switchChain({ chainId: 42220 });
      } catch (error) {
        return { success: false, error: 'Failed to switch to Celo network' };
      }
    }

    const contractAddress = getCoreContractAddress(42220);
    return await handleContractCall(
      contractAddress,
      PREDICTION_MARKET_CORE_ABI,
      'setUsername',
      [params.username]
    );
  }, [address, chainId, switchChain, handleContractCall]);

  // Change username
  const changeUsername = useCallback(async (params: UsernameChangeData) => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (chainId !== 42220) {
      try {
        await switchChain({ chainId: 42220 });
      } catch (error) {
        return { success: false, error: 'Failed to switch to Celo network' };
      }
    }

    const contractAddress = getCoreContractAddress(42220);
    return await handleContractCall(
      contractAddress,
      PREDICTION_MARKET_CORE_ABI,
      'changeUsername',
      [params.newUsername],
      parseEther('0.00001') // Username change fee
    );
  }, [address, chainId, switchChain, handleContractCall]);

  // Claim winnings
  const claimWinnings = useCallback(async (marketId: number) => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (chainId !== 42220) {
      try {
        await switchChain({ chainId: 42220 });
      } catch (error) {
        return { success: false, error: 'Failed to switch to Celo network' };
      }
    }

    const contractAddress = getClaimsContractAddress(42220);
    return await handleContractCall(
      contractAddress,
      PREDICTION_MARKET_CLAIMS_ABI,
      'claimWinnings',
      [BigInt(marketId)]
    );
  }, [address, chainId, switchChain, handleContractCall]);

  // Claim creator fee
  const claimCreatorFee = useCallback(async (marketId: number) => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (chainId !== 42220) {
      try {
        await switchChain({ chainId: 42220 });
      } catch (error) {
        return { success: false, error: 'Failed to switch to Celo network' };
      }
    }

    const contractAddress = getCoreContractAddress(42220);
    return await handleContractCall(
      contractAddress,
      PREDICTION_MARKET_CORE_ABI,
      'claimCreatorFee',
      [BigInt(marketId)]
    );
  }, [address, chainId, switchChain, handleContractCall]);

  // Clear error
  const clearError = useCallback(() => {
    setContractState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setContractState({
      isLoading: false,
      error: null,
      success: false,
      transactionHash: undefined,
      receipt: undefined
    });
  }, []);

  return {
    contractState,
    createMarket,
    buyShares,
    updateDatabaseAfterPurchase,
    resolveMarket,
    setUsername,
    changeUsername,
    claimWinnings,
    claimCreatorFee,
    clearError,
    resetState
  };
}
