import { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';
import { SNARKEL_ABI } from '@/contracts/abi';
import { REWARD_TOKENS } from '@/lib/tokens-config';

interface SessionReward {
  tokenAddress: string;
  amount: bigint;
  isDistributed: boolean;
}

interface Session0RewardsData {
  rewards: SessionReward[];
  supportedTokens: typeof REWARD_TOKENS;
  isLoading: boolean;
  error: string | null;
}

export const useSession0Rewards = (contractAddress?: string): Session0RewardsData => {
  const [rewards, setRewards] = useState<SessionReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch session 0 rewards from smart contract
  const { data: sessionRewards, isLoading: contractLoading, error: contractError } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: SNARKEL_ABI,
    functionName: 'getSessionRewards',
    args: [BigInt(0)], // Session 0
    query: {
      enabled: !!contractAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  });

  useEffect(() => {
    if (contractLoading) {
      setIsLoading(true);
      setError(null);
    } else if (contractError) {
      setIsLoading(false);
      setError(contractError.message);
    } else if (sessionRewards) {
      setIsLoading(false);
      setError(null);
      
      // Process the rewards data
      const processedRewards = sessionRewards.map((reward: any) => ({
        tokenAddress: reward.tokenAddress,
        amount: reward.amount,
        isDistributed: reward.isDistributed
      }));
      
      setRewards(processedRewards);
    }
  }, [sessionRewards, contractLoading, contractError]);

  // Get supported tokens for the current network
  const supportedTokens = REWARD_TOKENS.filter(token => 
    token.chainId === 8453 || token.chainId === 42220 // Base and Celo
  );

  return {
    rewards,
    supportedTokens,
    isLoading,
    error
  };
};
