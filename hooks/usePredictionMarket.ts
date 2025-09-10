import { useState, useCallback, useEffect } from 'react';
import { 
  useAccount, 
  useSwitchChain, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useReadContract,
  useSimulateContract,
  useWalletClient
} from 'wagmi';
import { 
  parseEther, 
  formatEther,
  encodeFunctionData,
  type Address,
  type TransactionReceipt
} from 'viem';
import { PREDICTION_MARKET_CORE_ABI, PREDICTION_MARKET_CLAIMS_ABI } from '@/contracts/contracts';
import { generateReferralTag, submitDivviReferral } from '@/lib/divvi';
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
  hasClaimedWinnings: (marketId: number) => Promise<boolean>;
  hasClaimedCreatorFee: (marketId: number) => Promise<boolean>;
  // State management
  clearError: () => void;
  resetState: () => void;
}

export function usePredictionMarket(): UsePredictionMarketReturn {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  
  const [contractState, setContractState] = useState<ContractState>({
    isLoading: false,
    error: null,
    success: false
  });

  const { writeContract, writeContractAsync, isPending, error: writeError, data: transactionHash } = useWriteContract();
  const { data: hash, isPending: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}`,
    query: {
      enabled: !!transactionHash
    }
  });

  // Update contract state when transaction status changes
  useEffect(() => {
    console.log('🔄 Contract state update:', {
      isPending,
      writeError: writeError?.message,
      isConfirmed,
      hash,
      transactionHash,
      currentTransactionHash: contractState.transactionHash
    });
    
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
      console.log('✅ Transaction confirmed!', { hash, receipt });
      setContractState(prev => ({ 
        ...prev, 
        isLoading: false, 
        success: true,
        transactionHash: transactionHash as string,
        receipt: hash
      }));
    }
  }, [isPending, writeError, isConfirmed, hash, transactionHash]);

  // Helper function to handle contract calls with mandatory Divvi referral tracking
  const handleContractCall = useCallback(async (
    contractAddress: Address,
    abi: any,
    functionName: string,
    args: any[],
    value?: bigint
  ) => {
    try {
      setContractState(prev => ({ ...prev, isLoading: true, error: null, success: false }));
      
      let hash: `0x${string}`;
      
      if (address && walletClient) {
        // Use Wagmi's wallet client for mandatory referral tracking
        try {
          // Generate referral tag
          const referralTag = generateReferralTag(address);
          
          // Encode function data
          const data = encodeFunctionData({
            abi,
            functionName,
            args,
          });
          
          // Append referral tag to data
          const dataWithReferral = data + referralTag;
          
          // Send transaction with referral data using Wagmi's wallet client
          hash = await walletClient.sendTransaction({
            account: address,
            to: contractAddress,
            data: dataWithReferral as `0x${string}`,
            value: value || 0n,
          });
          
          console.log('✅ Transaction sent with referral tag:', { hash, referralTag });
        } catch (error) {
          console.warn('Failed to send transaction with referral, falling back to regular transaction:', error);
          
          // Fallback to regular Wagmi transaction
          hash = await writeContractAsync({
            address: contractAddress,
            abi,
            functionName,
            args,
            value,
            chainId: 42220,
          });
        }
      } else {
        // Use regular Wagmi transaction if wallet client not available
        hash = await writeContractAsync({
          address: contractAddress,
          abi,
          functionName,
          args,
          value,
          chainId: 42220,
        });
      }
      
      setContractState(prev => ({ 
        ...prev, 
        transactionHash: hash as string,
        isLoading: true 
      }));
      
      // Submit referral to Divvi after successful transaction (mandatory)
      try {
        await submitDivviReferral(hash, 42220);
      } catch (error) {
        console.warn('Failed to submit Divvi referral:', error);
      }
      
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
  }, [writeContract, address, walletClient]);

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

    // Referral tracking is now handled in handleContractCall

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
      console.log(`🔄 updateDatabaseAfterPurchase called:`, {
        marketId: params.marketId,
        outcome: params.outcome,
        amount: params.amount,
        transactionHash
      });
      
      // Validate transaction hash
      if (!transactionHash) {
        console.error('❌ No transaction hash provided');
        return false;
      }
      
      if (!transactionHash.startsWith('0x') || transactionHash.length !== 66) {
        console.error('❌ Invalid transaction hash format:', transactionHash);
        return false;
      }
      
      // Use the process-transaction API which fetches real data from blockchain
      const processResponse = await fetch('/api/markets/process-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionHash: transactionHash,
          marketId: params.marketId
        }),
      });

      console.log('📡 Process response status:', processResponse.status);
      console.log('📡 Process response ok:', processResponse.ok);
      
      if (processResponse.ok) {
        const result = await processResponse.json();
        console.log('✅ Transaction processed successfully:', result);
        return true;
      } else {
        const errorData = await processResponse.json();
        console.error('❌ Failed to process transaction:', {
          status: processResponse.status,
          statusText: processResponse.statusText,
          errorData
        });
        return false;
      }

    } catch (error) {
      console.error('❌ Error processing transaction:', error);
      return false;
    }
  }, []);

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
      [BigInt(marketId)],
      undefined // No value
    );
  }, [address, chainId, switchChain, handleContractCall]);

  // Check if user has claimed winnings for a market
  const hasClaimedWinnings = useCallback(async (marketId: number): Promise<boolean> => {
    if (!address) return false;
    
    try {
      const claimsContractAddress = getClaimsContractAddress(42220);
      // Use a direct contract call since we can't use hooks inside callbacks
      const { createPublicClient, http } = await import('viem');
      const publicClient = createPublicClient({
        transport: http('https://forno.celo.org'),
        chain: celo,
      });
      
      const result = await publicClient.readContract({
        address: claimsContractAddress,
        abi: PREDICTION_MARKET_CLAIMS_ABI,
        functionName: 'hasUserClaimed',
        args: [BigInt(marketId), address as Address],
      });
      
      console.log('🔍 Checking winnings claim status:', {
        marketId,
        userAddress: address,
        claimsContractAddress,
        hasClaimed: result
      });
      
      return result as boolean;
    } catch (error) {
      console.error('Error checking winnings claim status:', error);
      return false;
    }
  }, [address]);

  // Check if user has claimed creator fee for a market
  const hasClaimedCreatorFee = useCallback(async (marketId: number): Promise<boolean> => {
    if (!address) return false;
    
    try {
      const coreContractAddress = getCoreContractAddress(42220);
      // Use a direct contract call since we can't use hooks inside callbacks
      const { createPublicClient, http } = await import('viem');
      const publicClient = createPublicClient({
        transport: http('https://forno.celo.org'),
        chain: celo,
      });
      
      const result = await publicClient.readContract({
        address: coreContractAddress,
        abi: PREDICTION_MARKET_CORE_ABI,
        functionName: 'getCreatorFeeInfo',
        args: [BigInt(marketId)],
      });
      
      // result is [creator, fee, claimed] - we need the third element (claimed)
      const [creator, fee, claimed] = result as [Address, bigint, boolean];
      
      console.log('🔍 Checking creator fee claim status:', {
        marketId,
        userAddress: address,
        coreContractAddress,
        creator,
        fee: fee.toString(),
        hasClaimed: claimed
      });
      
      return claimed;
    } catch (error) {
      console.error('Error checking creator fee claim status:', error);
      return false;
    }
  }, [address]);

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
    hasClaimedWinnings,
    hasClaimedCreatorFee,
    clearError,
    resetState
  };
}
