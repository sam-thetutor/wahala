import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite, useTransaction } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { celoAlfajores } from 'viem/chains';
import type { Hex } from 'viem';
import { getReferralDataSuffix, submitDivviReferral } from '@/lib/divvi';
import { SNARKEL_ABI } from '../contracts/abi'; // Import your ABI file

// Contract address - Replace with your deployed contract address
const SNARKEL_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS as Address || '0x...';

// Types
interface SnarkelSession {
  sessionId: number;
  snarkelCode: string;
  entryFee: bigint;
  platformFeePercentage: number;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
  createdAt: number;
  participants: Address[];
}

interface Reward {
  tokenAddress: Address;
  amount: bigint;
  isDistributed: boolean;
}

interface ContractError {
  message: string;
  code?: string;
}

interface ContractState {
  isLoading: boolean;
  error: ContractError | null;
  success: boolean;
}

export function useSnarkelContract(contractAddress?: Address) {
  const { address: userAddress, isConnected } = useAccount();
  const [contractState, setContractState] = useState<ContractState>({
    isLoading: false,
    error: null,
    success: false
  });

  const contractAddr = contractAddress || SNARKEL_CONTRACT_ADDRESS;

  // Helper function to handle contract state
  const updateState = useCallback((updates: Partial<ContractState>) => {
    setContractState(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setContractState({ isLoading: false, error: null, success: false });
  }, []);

  // READ FUNCTIONS

  // Get current session ID
  const { data: currentSessionId, refetch: refetchCurrentSessionId } = useContractRead({
    address: contractAddr,
    abi: SNARKEL_ABI,
    functionName: 'getCurrentSessionId',
    query: {
      enabled: !!contractAddr
    }
  });

  // Get session by ID
  const useSessionById = (sessionId: number | undefined) => {
    const { data, ...rest } = useContractRead({
      address: contractAddr,
      abi: SNARKEL_ABI,
      functionName: 'getSession',
      args: sessionId ? [BigInt(sessionId)] : undefined,
      query: {
        enabled: !!contractAddr && !!sessionId
      }
    });

    const processedData = data ? (() => {
      const [id, code, fee, platformFee, maxPart, currentPart, active, created, participants] = data;
      return {
        sessionId: Number(id),
        snarkelCode: code,
        entryFee: fee,
        platformFeePercentage: Number(platformFee),
        maxParticipants: Number(maxPart),
        currentParticipants: Number(currentPart),
        isActive: active,
        createdAt: Number(created),
        participants: participants as Address[]
      };
    })() : null;

    return { data: processedData, ...rest };
  };

  // Get session ID by code
  const useSessionByCode = (snarkelCode: string | undefined) => {
    const { data, ...rest } = useContractRead({
      address: contractAddr,
      abi: SNARKEL_ABI,
      functionName: 'getSessionIdByCode',
      args: snarkelCode ? [snarkelCode] : undefined,
      query: {
        enabled: !!contractAddr && !!snarkelCode
      }
    });

    return { data: data ? Number(data) : 0, ...rest };
  };

  // Check if user is participant
  const useIsParticipant = (sessionId: number | undefined, participantAddress?: Address) => {
    const participant = participantAddress || userAddress;
    return useContractRead({
      address: contractAddr,
      abi: SNARKEL_ABI,
      functionName: 'isParticipant',
      args: sessionId && participant ? [BigInt(sessionId), participant] : undefined,
      query: {
        enabled: !!contractAddr && !!sessionId && !!participant
      }
    });
  };

  // Check if user has claimed reward
  const useHasClaimedReward = (sessionId: number | undefined, participantAddress?: Address) => {
    const participant = participantAddress || userAddress;
    return useContractRead({
      address: contractAddr,
      abi: SNARKEL_ABI,
      functionName: 'hasClaimedReward',
      args: sessionId && participant ? [BigInt(sessionId), participant] : undefined,
      query: {
        enabled: !!contractAddr && !!sessionId && !!participant
      }
    });
  };

  // Get session rewards
  const useSessionRewards = (sessionId: number | undefined) => {
    const { data, ...rest } = useContractRead({
      address: contractAddr,
      abi: SNARKEL_ABI,
      functionName: 'getSessionRewards',
      args: sessionId ? [BigInt(sessionId)] : undefined,
      query: {
        enabled: !!contractAddr && !!sessionId
      }
    });

    const processedData = data ? data.map((reward: any) => ({
      tokenAddress: reward.tokenAddress,
      amount: reward.amount,
      isDistributed: reward.isDistributed
    })) : [];

    return { data: processedData, ...rest };
  };

  // Check if user is admin
  const useIsAdmin = (adminAddress?: Address) => {
    const admin = adminAddress || userAddress;
    return useContractRead({
      address: contractAddr,
      abi: SNARKEL_ABI,
      functionName: 'isAdmin',
      args: admin ? [admin] : undefined,
      query: {
        enabled: !!contractAddr && !!admin
      }
    });
  };

  // WRITE FUNCTIONS

  // Create snarkel session
  const {
    writeContract: createSessionWrite,
    data: createSessionData,
    isPending: createSessionLoading
  } = useContractWrite();

  const { isLoading: createSessionTxLoading } = useTransaction({
    hash: createSessionData
  });

  const createSession = useCallback(async (
    snarkelCode: string,
    entryFeeEth: string,
    platformFeePercentage: number,
    maxParticipants: number,
    expectedRewardToken: Address = '0x0000000000000000000000000000000000000000' as Address,
    expectedRewardAmount: string = '0'
  ) => {
    if (!createSessionWrite) return;
    
    resetState();
    updateState({ isLoading: true });
    
    try {
      const entryFeeWei = parseEther(entryFeeEth);
      createSessionWrite({
        address: contractAddr,
        abi: SNARKEL_ABI,
        functionName: 'createSnarkelSession',
        args: [
          snarkelCode, 
          entryFeeWei, 
          BigInt(platformFeePercentage), 
          BigInt(maxParticipants),
          expectedRewardToken,
          BigInt(expectedRewardAmount)
        ],
        dataSuffix: getReferralDataSuffix()
      });
    } catch (error: any) {
      updateState({ error: { message: error.message }, isLoading: false });
    }
  }, [createSessionWrite, resetState, updateState, contractAddr]);

  // Join snarkel
  const {
    writeContract: joinSnarkelWrite,
    data: joinSnarkelData,
    isPending: joinSnarkelLoading
  } = useContractWrite();

  const { isLoading: joinSnarkelTxLoading } = useTransaction({
    hash: joinSnarkelData
  });

  const joinSnarkel = useCallback(async (sessionId: number, entryFeeEth: string) => {
    if (!joinSnarkelWrite) return;
    
    resetState();
    updateState({ isLoading: true });
    
    try {
      const entryFeeWei = parseEther(entryFeeEth);
      joinSnarkelWrite({
        address: contractAddr,
        abi: SNARKEL_ABI,
        functionName: 'joinSnarkel',
        args: [BigInt(sessionId)],
        value: entryFeeWei,
        dataSuffix: getReferralDataSuffix()
      });
    } catch (error: any) {
      updateState({ error: { message: error.message }, isLoading: false });
    }
  }, [joinSnarkelWrite, resetState, updateState, contractAddr]);

  // Add participant (admin only)
  const {
    writeContract: addParticipantWrite,
    data: addParticipantData,
    isPending: addParticipantLoading
  } = useContractWrite();

  const { isLoading: addParticipantTxLoading } = useTransaction({
    hash: addParticipantData
  });

  const addParticipant = useCallback(async (sessionId: number, participantAddress: Address) => {
    if (!addParticipantWrite) return;
    
    resetState();
    updateState({ isLoading: true });
    
    try {
      addParticipantWrite({
        address: contractAddr,
        abi: SNARKEL_ABI,
        functionName: 'addParticipant',
        args: [BigInt(sessionId), participantAddress],
        dataSuffix: getReferralDataSuffix()
      });
    } catch (error: any) {
      updateState({ error: { message: error.message }, isLoading: false });
    }
  }, [addParticipantWrite, resetState, updateState, contractAddr]);

  // Batch add participants (admin only)
  const {
    writeContract: batchAddParticipantsWrite,
    data: batchAddParticipantsData,
    isPending: batchAddParticipantsLoading
  } = useContractWrite();

  const { isLoading: batchAddParticipantsTxLoading } = useTransaction({
    hash: batchAddParticipantsData
  });

  const batchAddParticipants = useCallback(async (sessionId: number, participants: Address[]) => {
    if (!batchAddParticipantsWrite) return;
    
    resetState();
    updateState({ isLoading: true });
    
    try {
      batchAddParticipantsWrite({
        address: contractAddr,
        abi: SNARKEL_ABI,
        functionName: 'batchAddParticipants',
        args: [BigInt(sessionId), participants],
        dataSuffix: getReferralDataSuffix()
      });
    } catch (error: any) {
      updateState({ error: { message: error.message }, isLoading: false });
    }
  }, [batchAddParticipantsWrite, resetState, updateState, contractAddr]);

  // Add reward (admin only)
  const {
    writeContract: addRewardWrite,
    data: addRewardData,
    isPending: addRewardLoading
  } = useContractWrite();

  const { isLoading: addRewardTxLoading } = useTransaction({
    hash: addRewardData
  });

  const addReward = useCallback(async (sessionId: number, tokenAddress: Address, amount: string) => {
    if (!addRewardWrite) return;
    
    resetState();
    updateState({ isLoading: true });
    
    try {
      addRewardWrite({
        address: contractAddr,
        abi: SNARKEL_ABI,
        functionName: 'addReward',
        args: [BigInt(sessionId), tokenAddress, BigInt(amount)],
        dataSuffix: getReferralDataSuffix()
      });
    } catch (error: any) {
      updateState({ error: { message: error.message }, isLoading: false });
    }
  }, [addRewardWrite, resetState, updateState, contractAddr]);

  // Distribute rewards to all participants (admin only)
  const {
    writeContract: distributeRewardsWrite,
    data: distributeRewardsData,
    isPending: distributeRewardsLoading
  } = useContractWrite();

  const { isLoading: distributeRewardsTxLoading } = useTransaction({
    hash: distributeRewardsData
  });

  const distributeRewards = useCallback(async (sessionId: number, tokenAddress: Address) => {
    if (!distributeRewardsWrite) return;
    
    resetState();
    updateState({ isLoading: true });
    
    try {
      distributeRewardsWrite({
        address: contractAddr,
        abi: SNARKEL_ABI,
        functionName: 'distributeRewards',
        args: [BigInt(sessionId), tokenAddress],
        dataSuffix: getReferralDataSuffix()
      });
    } catch (error: any) {
      updateState({ error: { message: error.message }, isLoading: false });
    }
  }, [distributeRewardsWrite, resetState, updateState, contractAddr]);

  // Deactivate session (admin only)
  const {
    writeContract: deactivateSessionWrite,
    data: deactivateSessionData,
    isPending: deactivateSessionLoading
  } = useContractWrite();

  const { isLoading: deactivateSessionTxLoading } = useTransaction({
    hash: deactivateSessionData
  });

  const deactivateSession = useCallback(async (sessionId: number) => {
    if (!deactivateSessionWrite) return;
    
    resetState();
    updateState({ isLoading: true });
    
    try {
      deactivateSessionWrite({
        address: contractAddr,
        abi: SNARKEL_ABI,
        functionName: 'deactivateSession',
        args: [BigInt(sessionId)],
        dataSuffix: getReferralDataSuffix()
      });
    } catch (error: any) {
      updateState({ error: { message: error.message }, isLoading: false });
    }
  }, [deactivateSessionWrite, resetState, updateState, contractAddr]);

  // Helper functions
  const formatEntryFee = useCallback((entryFee: bigint) => {
    return formatEther(entryFee);
  }, []);

  const isAnyTransactionLoading = 
    createSessionLoading || createSessionTxLoading ||
    joinSnarkelLoading || joinSnarkelTxLoading ||
    addParticipantLoading || addParticipantTxLoading ||
    batchAddParticipantsLoading || batchAddParticipantsTxLoading ||
    addRewardLoading || addRewardTxLoading ||
    distributeRewardsLoading || distributeRewardsTxLoading ||
    deactivateSessionLoading || deactivateSessionTxLoading;

  useEffect(() => {
    updateState({ isLoading: isAnyTransactionLoading });
  }, [isAnyTransactionLoading, updateState]);

  // Submit Divvi referral for any new tx hash emitted by wagmi write hooks
  useEffect(() => {
    const hashes: (string | undefined)[] = [
      createSessionData,
      joinSnarkelData,
      addParticipantData,
      batchAddParticipantsData,
      addRewardData,
      distributeRewardsData,
      deactivateSessionData
    ];
    for (const h of hashes) {
      if (h) {
        submitDivviReferral(h as Hex, celoAlfajores.id).catch(() => {});
      }
    }
  }, [
    createSessionData,
    joinSnarkelData,
    addParticipantData,
    batchAddParticipantsData,
    addRewardData,
    distributeRewardsData,
    deactivateSessionData
  ]);

  return {
    // Contract state
    contractState: {
      ...contractState,
      isLoading: contractState.isLoading || isAnyTransactionLoading
    },
    resetState,
    
    // Contract info
    contractAddress: contractAddr,
    isConnected,
    userAddress,
    currentSessionId: currentSessionId ? Number(currentSessionId) : 0,

    // Read hooks
    useSessionById,
    useSessionByCode,
    useIsParticipant,
    useHasClaimedReward,
    useSessionRewards,
    useIsAdmin,

    // Write functions
    createSession,
    joinSnarkel,
    addParticipant,
    batchAddParticipants,
    addReward,
    distributeRewards,
    deactivateSession,

    // Helpers
    formatEntryFee,
    
    // Transaction hashes for tracking
    transactions: {
      createSession: createSessionData,
      joinSnarkel: joinSnarkelData,
      addParticipant: addParticipantData,
      batchAddParticipants: batchAddParticipantsData,
      addReward: addRewardData,
      distributeRewards: distributeRewardsData,
      deactivateSession: deactivateSessionData
    }
  };
}