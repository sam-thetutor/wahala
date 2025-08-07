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
const QUIZ_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS as Address || '0x...';

interface ContractState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  transactionHash?: string;
  receipt?: TransactionReceipt;
}

interface QuizResult {
  participant: Address;
  score: bigint;
  rewardAmount: bigint;
}

interface QuizSession {
  sessionId: bigint;
  quizCode: string;
  entryFee: bigint;
  platformFeePercentage: bigint;
  maxParticipants: bigint;
  currentParticipants: bigint;
  isActive: boolean;
  isCompleted: boolean;
  resultsSubmitted: boolean;
  createdAt: bigint;
  completedAt: bigint;
  rewardToken: Address;
  totalRewardPool: bigint;
  maxPossibleScore: bigint;
  rewardPerPoint: bigint;
}

interface QuizStats {
  totalSessions: bigint;
  totalRewardsDistributed: bigint;
  sessionId: bigint;
}

interface SessionRewardStats {
  totalDistributed: bigint;
  participantsRewarded: bigint;
  totalParticipants: bigint;
  rewardPoolRemaining: bigint;
}

interface UseQuizContractReturn {
  contractState: ContractState;
  // Quiz session management
  createSnarkelSession: (params: {
    snarkelCode: string;
    entryFeeWei: string;
    platformFeePercentage: number;
    maxParticipants: number;
    expectedRewardToken: Address;
    expectedRewardAmount: string;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  addReward: (params: {
    sessionId: number;
    tokenAddress: Address;
    amount: string;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  distributeRewards: (params: {
    sessionId: number;
    tokenAddress: Address;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  adminDistributeReward: (params: {
    sessionId: number;
    tokenAddress: Address;
    amount: string;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  // Participant management
  addParticipant: (params: {
    sessionId: number;
    participant: Address;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  batchAddParticipants: (params: {
    sessionId: number;
    participants: Address[];
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  removeParticipant: (params: {
    sessionId: number;
    participant: Address;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  // Token operations
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
  // Read functions
  getTokenBalance: (tokenAddress: Address, userAddress: Address) => Promise<string>;
  getTokenAllowance: (tokenAddress: Address, ownerAddress: Address, spenderAddress: Address) => Promise<string>;
  // Security check functions
  areRewardsDistributed: (snarkelCode: string) => Promise<boolean>;
  getExpectedRewardToken: (sessionId: number) => Promise<Address>;
  getExpectedRewardAmount: (sessionId: number) => Promise<string>;
  resetState: () => void;
}

export function useQuizContract(): UseQuizContractReturn {
  const { address: userAddress, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  
  const [fallbackChainId, setFallbackChainId] = useState<number | undefined>(undefined);
  
  const [contractState, setContractState] = useState<ContractState>({
    isLoading: false,
    error: null,
    success: false
  });

  console.log('User address:', userAddress);
  console.log('Current chain ID:', chainId);
  console.log('Fallback chain ID:', fallbackChainId);

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

  const ensureCorrectChain = useCallback(async (): Promise<void> => {
    try {
      const currentChainId = chainId || fallbackChainId;
      
      if (!currentChainId || currentChainId !== celoAlfajores.id) {
        console.log(`Switching to Alfajores (${celoAlfajores.id}). Current chain: ${currentChainId || 'undefined'}`);
        await switchChain({ chainId: celoAlfajores.id });
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFallbackChainId(celoAlfajores.id);
      }
    } catch (error) {
      console.error('Chain switching failed:', error);
      console.warn('Chain switching failed, but continuing with operation. Please ensure you are on Alfajores testnet.');
    }
  }, [chainId, fallbackChainId, switchChain]);

  // Create quiz session (updated function signature)
  const createSnarkelSession = useCallback(async (params: {
    snarkelCode: string;
    entryFeeWei: string;
    platformFeePercentage: number;
    maxParticipants: number;
    expectedRewardToken: Address;
    expectedRewardAmount: string;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      console.log('Wallet connected:', { userAddress, chainId });
      console.log('Creating quiz session with params:', params);

      if (!params.expectedRewardToken || params.expectedRewardToken === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid expected reward token address');
      }

      if (params.maxParticipants <= 0) {
        throw new Error('Max participants must be greater than 0');
      }

      if (params.expectedRewardAmount === '0') {
        throw new Error('Expected reward amount must be greater than 0');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const hash = await writeContractAsync({
        address: QUIZ_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'createSnarkelSession',
        args: [
          params.snarkelCode,
          BigInt(params.entryFeeWei),
          BigInt(params.platformFeePercentage),
          BigInt(params.maxParticipants),
          params.expectedRewardToken,
          BigInt(params.expectedRewardAmount)
        ]
      });

      console.log('Transaction hash:', hash);
      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Create quiz session error:', error);
      
      let errorMessage = error.message || 'Failed to create quiz session';
      
      if (error.message?.includes('getChainId is not a function')) {
        errorMessage = 'Wallet connection issue detected. Please try disconnecting and reconnecting your wallet.';
      } else if (error.message?.includes('Invalid expected reward token address')) {
        errorMessage = 'Invalid expected reward token address provided.';
      }
      
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, writeContractAsync]);

  // Add reward to session
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

      console.log('Adding reward to session:', params);

      const hash = await writeContractAsync({
        address: QUIZ_CONTRACT_ADDRESS,
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
      updateState({ isLoading: false, success: true });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Add reward error:', error);
      
      let errorMessage = error.message || 'Failed to add reward';
      
      if (error.message?.includes('Reward already added')) {
        errorMessage = 'Reward has already been added to this session.';
      } else if (error.message?.includes('Reward amount must be greater than 0')) {
        errorMessage = 'Reward amount must be greater than 0.';
      } else if (error.message?.includes('Token transfer failed')) {
        errorMessage = 'Token transfer failed. Please ensure you have approved the contract to spend your tokens.';
      }
      
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // Distribute rewards for a session
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

      console.log('Distributing rewards for session:', params.sessionId);

      const hash = await writeContractAsync({
        address: QUIZ_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'distributeRewards',
        args: [
          BigInt(params.sessionId),
          params.tokenAddress
        ]
      });

      console.log('Distribute rewards transaction hash:', hash);
      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Distribute rewards error:', error);
      
      let errorMessage = error.message || 'Failed to distribute rewards';
      
      if (error.message?.includes('Rewards already distributed')) {
        errorMessage = 'Rewards have already been distributed for this session.';
      } else if (error.message?.includes('Session not active')) {
        errorMessage = 'Session is not active.';
      }
      
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // Admin distribute remaining reward
  const adminDistributeReward = useCallback(async (params: {
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

      console.log('Admin distributing remaining reward for session:', params.sessionId);

      const hash = await writeContractAsync({
        address: QUIZ_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'adminDistributeReward',
        args: [
          BigInt(params.sessionId),
          params.tokenAddress,
          BigInt(params.amount)
        ]
      });

      console.log('Admin distribute remaining reward transaction hash:', hash);
      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Admin distribute remaining reward error:', error);
      updateState({ isLoading: false, error: error.message || 'Failed to distribute remaining reward' });
      return { success: false, error: error.message || 'Failed to distribute remaining reward' };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // Add participant (admin function)
  const addParticipant = useCallback(async (params: {
    sessionId: number;
    participant: Address;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      const hash = await writeContractAsync({
        address: QUIZ_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'addParticipant',
        args: [BigInt(params.sessionId), params.participant]
      });

      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Add participant error:', error);
      updateState({ isLoading: false, error: error.message || 'Failed to add participant' });
      return { success: false, error: error.message || 'Failed to add participant' };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // Batch add participants (admin function)
  const batchAddParticipants = useCallback(async (params: {
    sessionId: number;
    participants: Address[];
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      const hash = await writeContractAsync({
        address: QUIZ_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'batchAddParticipants',
        args: [BigInt(params.sessionId), params.participants]
      });

      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Batch add participants error:', error);
      updateState({ isLoading: false, error: error.message || 'Failed to add participants' });
      return { success: false, error: error.message || 'Failed to add participants' };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // Remove participant (admin function)
  const removeParticipant = useCallback(async (params: {
    sessionId: number;
    participant: Address;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      const hash = await writeContractAsync({
        address: QUIZ_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'removeParticipant',
        args: [BigInt(params.sessionId), params.participant]
      });

      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Remove participant error:', error);
      updateState({ isLoading: false, error: error.message || 'Failed to remove participant' });
      return { success: false, error: error.message || 'Failed to remove participant' };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // Token operations (keeping existing implementations)
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
      updateState({ isLoading: false, success: true });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Approve token error:', error);
      
      let errorMessage = error.message || 'Failed to approve token';
      
      if (error.message?.includes('getChainId is not a function')) {
        errorMessage = 'Wallet connection issue detected. Please try disconnecting and reconnecting your wallet.';
      }
      
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

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
      updateState({ isLoading: false, success: true });

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Transfer token error:', error);
      
      let errorMessage = error.message || 'Failed to transfer token';
      
      if (error.message?.includes('getChainId is not a function')) {
        errorMessage = 'Wallet connection issue detected. Please try disconnecting and reconnecting your wallet.';
      }
      
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync]);

  // Read functions using createPublicClient
  const getTokenBalance = useCallback(async (tokenAddress: Address, userAddress: Address, tokenChainId?: number): Promise<string> => {
    try {
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

  const getTokenAllowance = useCallback(async (
    tokenAddress: Address, 
    ownerAddress: Address, 
    spenderAddress: Address,
    tokenChainId?: number
  ): Promise<string> => {
    try {
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

  // Security check functions
  const areRewardsDistributed = useCallback(async (snarkelCode: string): Promise<boolean> => {
    try {
      const client = createPublicClient({
        chain: celoAlfajores,
        transport: http()
      });

      const result = await readContract(client, {
        address: QUIZ_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'areRewardsDistributed',
        args: [snarkelCode]
      }) as boolean;

      return result;
    } catch (error: any) {
      console.error('Are rewards distributed error:', error);
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
        address: QUIZ_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'getRewardTokenAddress',
        args: [BigInt(sessionId)]
      }) as Address;

      return result;
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
        address: QUIZ_CONTRACT_ADDRESS,
        abi: SNARKEL_ABI,
        functionName: 'getExpectedRewardAmount',
        args: [BigInt(sessionId)]
      }) as bigint;

      return result.toString();
    } catch (error: any) {
      console.error('Get expected reward amount error:', error);
      return '0';
    }
  }, []);

  return {
    contractState,
    // Quiz session management
    createSnarkelSession,
    addReward,
    distributeRewards,
    adminDistributeReward,
    // Participant management
    addParticipant,
    batchAddParticipants,
    removeParticipant,
    // Token operations
    approveToken,
    transferToken,
    // Read functions
    getTokenBalance,
    getTokenAllowance,
    // Security check functions
    areRewardsDistributed,
    getExpectedRewardToken,
    getExpectedRewardAmount,
    resetState
  };
}