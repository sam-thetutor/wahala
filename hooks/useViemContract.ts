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
  type TransactionReceipt,
  createPublicClient,
  http
} from 'viem';
import { celoAlfajores } from 'viem/chains';
import { SNARKEL_ABI } from '../contracts/abi';
import { ERC20_ABI } from '../contracts/erc20-abi';
import { readContract } from 'viem/actions';
import { readTokenBalance, readTokenAllowance } from '../utils/contract-reader';

// Contract addresses
const SNARKEL_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS as Address || '0x...';

interface ContractState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  transactionHash?: string;
  receipt?: TransactionReceipt;
}

interface UseWagmiContractReturn {
  contractState: ContractState;
  createSession: (params: {
    snarkelCode: string;
    entryFeeWei: string;
    platformFeePercentage: number;
    maxParticipants: number;
    expectedRewardToken: Address;  // NEW: Required reward token
    expectedRewardAmount: string;  // NEW: Required reward amount
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  addReward: (params: {
    sessionId: number;
    tokenAddress: Address;
    amount: string;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  distributeRewards: (params: {  // NEW: Bulk distribution function
    sessionId: number;
    tokenAddress: Address;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  approveToken: (params: {
    tokenAddress: Address;
    spenderAddress: Address;
    amount: string;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  transferToken: (params: {
    tokenAddress: Address;
    toAddress: Address;
    amount: string;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  getTokenBalance: (tokenAddress: Address, userAddress: Address) => Promise<string>;
  getTokenAllowance: (tokenAddress: Address, ownerAddress: Address, spenderAddress: Address) => Promise<string>;
  // NEW: Security check functions
  areRewardsDistributed: (snarkelCode: string) => Promise<boolean>;
  getExpectedRewardToken: (sessionId: number) => Promise<Address>;
  getExpectedRewardAmount: (sessionId: number) => Promise<string>;
  resetState: () => void;
}

export function useWagmiContract(): UseWagmiContractReturn {
  const { address: userAddress, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  
  // Add a fallback chain ID for when the connector doesn't provide it
  const [fallbackChainId, setFallbackChainId] = useState<number | undefined>(undefined);
  
  const [contractState, setContractState] = useState<ContractState>({
    isLoading: false,
    error: null,
    success: false
  });

  console.log('User address:', userAddress);
  console.log('Current chain ID:', chainId);
  console.log('Fallback chain ID:', fallbackChainId);

  // Initialize fallback chain ID when component mounts or chainId changes
  useEffect(() => {
    if (chainId) {
      setFallbackChainId(chainId);
      console.log('Updated fallback chain ID to:', chainId);
    }
  }, [chainId]);

  const updateState = useCallback((updates: Partial<ContractState>) => {
    setContractState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(() => {
    setContractState({
      isLoading: false,
      error: null,
      success: false
    });
  }, []);

  // Ensure we're on the correct chain with error handling for connector issues
  const ensureCorrectChain = useCallback(async (): Promise<void> => {
    try {
      // Use the actual chainId if available, otherwise use fallback
      const currentChainId = chainId || fallbackChainId;
      
      // If chainId is undefined, we'll assume we need to switch to the correct chain
      // This handles the case where the connector doesn't properly implement getChainId
      if (!currentChainId || currentChainId !== celoAlfajores.id) {
        console.log(`Switching to Alfajores (${celoAlfajores.id}). Current chain: ${currentChainId || 'undefined'}`);
        await switchChain({ chainId: celoAlfajores.id });
        // Wait a bit for the chain switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Set fallback chain ID to Alfajores after successful switch
        setFallbackChainId(celoAlfajores.id);
      }
    } catch (error) {
      console.error('Chain switching failed:', error);
      // Don't throw an error here, just log it and continue
      // The user can manually switch networks if needed
      console.warn('Chain switching failed, but continuing with operation. Please ensure you are on Alfajores testnet.');
    }
  }, [chainId, fallbackChainId, switchChain]);

  // UPDATED: Create snarkel session with reward token validation
  const createSession = useCallback(async (params: {
    snarkelCode: string;
    entryFeeWei: string;
    platformFeePercentage: number;
    maxParticipants: number;
    expectedRewardToken: Address;  // NEW: Required reward token
    expectedRewardAmount: string;  // NEW: Required reward amount  
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      console.log('Wallet connected:', { userAddress, chainId });
      console.log('Creating session with params:', params);

      // Validate reward token address
      if (!params.expectedRewardToken || params.expectedRewardToken === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid reward token address');
      }

      // Validate reward amount
      if (!params.expectedRewardAmount || BigInt(params.expectedRewardAmount) <= 0) {
        throw new Error('Reward amount must be greater than 0');
      }

      // Add a small delay to ensure the chain switch is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // UPDATED: New function signature with reward token validation
      const hash = await writeContractAsync({
        address: SNARKEL_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'createSnarkelSession',
        args: [
          params.snarkelCode,
          BigInt(params.entryFeeWei),
          BigInt(params.platformFeePercentage),
          BigInt(params.maxParticipants),
          params.expectedRewardToken,     // NEW
          BigInt(params.expectedRewardAmount)  // NEW
        ]
      });

      console.log('Transaction hash:', hash);
      updateState({ transactionHash: hash });

      updateState({ 
        isLoading: false, 
        success: true
      });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Create session error:', error);
      
      let errorMessage = error.message || 'Failed to create session';
      
      if (error.message?.includes('getChainId is not a function')) {
        errorMessage = 'Wallet connection issue detected. This is likely due to a compatibility issue with your wallet. Please try:\n1. Disconnecting and reconnecting your wallet\n2. Switching to Alfajores testnet manually\n3. Using a different wallet if the issue persists';
      } else if (error.message?.includes('connection.connector')) {
        errorMessage = 'Wallet connection error. Please ensure your wallet is properly connected and you are on the Alfajores testnet. If the issue persists, try using a different wallet.';
      } else if (error.message?.includes('Invalid reward token address')) {
        errorMessage = 'Invalid reward token address provided. Please check the token address and try again.';
      } else if (error.message?.includes('Reward amount must be greater than 0')) {
        errorMessage = 'Reward amount must be greater than 0. Please specify a valid reward amount.';
      }
      
      updateState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, writeContractAsync]);

  // NEW: Add reward function with enhanced validation
  const addReward = useCallback(async (params: {
    sessionId: number;
    tokenAddress: Address;
    amount: string;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Adding reward:', params);

      const hash = await writeContractAsync({
        address: SNARKEL_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'addReward',
        args: [
          BigInt(params.sessionId),
          params.tokenAddress,
          BigInt(params.amount)
        ]
      });

      console.log('Add reward transaction hash:', hash);
      updateState({ transactionHash: hash });

      updateState({ 
        isLoading: false, 
        success: true
      });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Add reward error:', error);
      
      let errorMessage = error.message || 'Failed to add reward';
      
      if (error.message?.includes('Token address does not match expected reward token')) {
        errorMessage = 'The token address does not match the expected reward token for this session. Please use the correct token address.';
      } else if (error.message?.includes('Amount does not match expected reward amount')) {
        errorMessage = 'The amount does not match the expected reward amount for this session. Please use the correct amount.';
      } else if (error.message?.includes('Rewards already added for this session')) {
        errorMessage = 'Rewards have already been added to this session. Each session can only have rewards added once.';
      }
      
      updateState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // NEW: Distribute rewards to all participants function
  const distributeRewards = useCallback(async (params: {
    sessionId: number;
    tokenAddress: Address;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Distributing rewards to all participants:', params);

      const hash = await writeContractAsync({
        address: SNARKEL_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'distributeRewards',
        args: [
          BigInt(params.sessionId),
          params.tokenAddress
        ]
      });

      console.log('Distribute rewards transaction hash:', hash);
      updateState({ transactionHash: hash });

      updateState({ 
        isLoading: false, 
        success: true
      });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Distribute rewards error:', error);
      
      let errorMessage = error.message || 'Failed to distribute rewards';
      
      if (error.message?.includes('Reward not found')) {
        errorMessage = 'No rewards found for this session and token. Please add rewards first.';
      } else if (error.message?.includes('No reward to distribute')) {
        errorMessage = 'No reward to distribute. The amount per participant would be zero.';
      } else if (error.message?.includes('Token transfer failed')) {
        errorMessage = 'Token transfer failed. Please check the token contract and try again.';
      } else if (error.message?.includes('Not authorized')) {
        errorMessage = 'You are not authorized to distribute rewards. Only admin wallets can perform this action.';
      }
      
      updateState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // Approve token spending
  const approveToken = useCallback(async (params: {
    tokenAddress: Address;
    spenderAddress: Address;
    amount: string;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      await ensureCorrectChain();

      // Add a small delay to ensure the chain switch is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Approving token:', params);

      const hash = await writeContractAsync({
        address: params.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [params.spenderAddress, BigInt(params.amount)]
      });

      console.log('Approve transaction hash:', hash);
      updateState({ transactionHash: hash });

      updateState({ 
        isLoading: false, 
        success: true
      });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Approve token error:', error);
      
      let errorMessage = error.message || 'Failed to approve token';
      
      if (error.message?.includes('getChainId is not a function')) {
        errorMessage = 'Wallet connection issue detected. This is likely due to a compatibility issue with your wallet. Please try:\n1. Disconnecting and reconnecting your wallet\n2. Switching to Alfajores testnet manually\n3. Using a different wallet if the issue persists';
      } else if (error.message?.includes('connection.connector')) {
        errorMessage = 'Wallet connection error. Please ensure your wallet is properly connected and you are on the Alfajores testnet. If the issue persists, try using a different wallet.';
      } else if (error.message?.includes('after multiple retries')) {
        errorMessage = 'Token approval failed after multiple attempts. Please check your wallet connection and try again.';
      }
      
      updateState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // Transfer token
  const transferToken = useCallback(async (params: {
    tokenAddress: Address;
    toAddress: Address;
    amount: string;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      await ensureCorrectChain();

      // Add a small delay to ensure the chain switch is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Transferring token:', params);

      const hash = await writeContractAsync({
        address: params.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [params.toAddress, BigInt(params.amount)]
      });

      console.log('Transfer transaction hash:', hash);
      updateState({ transactionHash: hash });

      updateState({ 
        isLoading: false, 
        success: true
      });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Transfer token error:', error);
      
      let errorMessage = error.message || 'Failed to transfer token';
      
      if (error.message?.includes('getChainId is not a function')) {
        errorMessage = 'Wallet connection issue detected. This is likely due to a compatibility issue with your wallet. Please try:\n1. Disconnecting and reconnecting your wallet\n2. Switching to Alfajores testnet manually\n3. Using a different wallet if the issue persists';
      } else if (error.message?.includes('connection.connector')) {
        errorMessage = 'Wallet connection error. Please ensure your wallet is properly connected and you are on the Alfajores testnet. If the issue persists, try using a different wallet.';
      } else if (error.message?.includes('after multiple retries')) {
        errorMessage = 'Token transfer failed after multiple attempts. Please check your wallet connection and try again.';
      }
      
      updateState({ 
        isLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // Get token balance using the backend API
  const getTokenBalance = useCallback(async (tokenAddress: Address, userAddress: Address, tokenChainId?: number): Promise<string> => {
    try {
      // Use the token's chain ID if provided, otherwise fallback to current chain
      const targetChainId = tokenChainId || celoAlfajores.id;
      
      console.log(`Checking token balance on chain ${targetChainId} for token ${tokenAddress}`);
      
      const balance = await readTokenBalance(tokenAddress, userAddress, targetChainId);
      const formattedBalance = formatEther(BigInt(balance));
      console.log(`Token balance: ${formattedBalance}`);
      return formattedBalance;
    } catch (error: any) {
      console.error('Get token balance error:', error);
      return '0';
    }
  }, []);

  // Get token allowance using the backend API
  const getTokenAllowance = useCallback(async (
    tokenAddress: Address, 
    ownerAddress: Address, 
    spenderAddress: Address,
    tokenChainId?: number
  ): Promise<string> => {
    try {
      // Use the token's chain ID if provided, otherwise fallback to current chain
      const targetChainId = tokenChainId || celoAlfajores.id;
      
      console.log(`Checking token allowance on chain ${targetChainId} for token ${tokenAddress}`);
      
      const allowance = await readTokenAllowance(tokenAddress, ownerAddress, spenderAddress, targetChainId);
      const formattedAllowance = formatEther(BigInt(allowance));
      console.log(`Token allowance: ${formattedAllowance}`);
      return formattedAllowance;
    } catch (error: any) {
      console.error('Get token allowance error:', error);
      return '0';
    }
  }, []);

  // NEW: Security check functions
  const areRewardsDistributed = useCallback(async (snarkelCode: string): Promise<boolean> => {
    try {
      const client = createPublicClient({
        chain: celoAlfajores,
        transport: http()
      });

      const result = await readContract(client, {
        address: SNARKEL_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'areRewardsDistributed',
        args: [snarkelCode]
      });

      return result as boolean;
    } catch (error: any) {
      console.error('Check rewards distributed error:', error);
      return false;
    }
  }, []);

  const getExpectedRewardToken = useCallback(async (sessionId: number): Promise<Address> => {
    try {
      const client = createPublicClient({
        chain: celoAlfajores,
        transport: http()
      });

      const result = await readContract(client, {
        address: SNARKEL_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'getRewardTokenAddress',
        args: [BigInt(sessionId)]
      });

      return result as Address;
    } catch (error: any) {
      console.error('Get expected reward token error:', error);
      return '0x0000000000000000000000000000000000000000' as Address;
    }
  }, []);

  const getExpectedRewardAmount = useCallback(async (sessionId: number): Promise<string> => {
    try {
      const client = createPublicClient({
        chain: celoAlfajores,
        transport: http()
      });

      const result = await readContract(client, {
        address: SNARKEL_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'getExpectedRewardAmount',
        args: [BigInt(sessionId)]
      });

      return formatEther(result as bigint);
    } catch (error: any) {
      console.error('Get expected reward amount error:', error);
      return '0';
    }
  }, []);

  return {
    contractState,
    createSession,
    addReward,               // NEW
    distributeRewards,       // NEW
    approveToken,
    transferToken,
    getTokenBalance,
    getTokenAllowance,
    areRewardsDistributed,   // NEW
    getExpectedRewardToken,  // NEW
    getExpectedRewardAmount, // NEW
    resetState
  };
}