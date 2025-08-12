import { NextRequest, NextResponse } from 'next/server';
import type { Hex } from 'viem';
import { getReferralDataSuffix, submitDivviReferral } from '@/lib/divvi';
import { PrismaClient } from '@prisma/client';
import { createPublicClient, createWalletClient, http, parseEther, getAddress } from 'viem';
import { celo, celoAlfajores, base, baseSepolia } from 'viem/chains';
import { erc20Abi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SNARKEL_ABI } from '@/contracts/abi';

const prisma = new PrismaClient();

interface DistributeRewardsRequest {
  roomId: string;
  sessionNumber: number;
  finalLeaderboard: Array<{
    userId: string;
    name: string;
    score: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check required environment variables first
    if (!process.env.ADMIN_WALLET) {
      console.error('ADMIN_WALLET environment variable is not set');
      return NextResponse.json({
        success: false,
        error: 'Server configuration error',
        details: 'Admin wallet not configured. Please contact the administrator.',
        code: 'MISSING_ADMIN_WALLET'
      }, { status: 500 });
    }

    const body: DistributeRewardsRequest = await request.json();
    const { roomId, sessionNumber, finalLeaderboard } = body;

    console.log('Automatic reward distribution request:', { roomId, sessionNumber, finalLeaderboard });

    // Validate required fields
    if (!roomId || !sessionNumber) {
      return NextResponse.json({
        success: false,
        error: 'Room ID and session number are required'
      }, { status: 400 });
    }

    // Get room and snarkel information
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        snarkel: {
          include: {
            rewards: {
              where: {
                isDistributed: false
              }
            },
            questions: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json({
        success: false,
        error: 'Room not found'
      }, { status: 404 });
    }

    // Check if rewards are enabled for this snarkel
    if (!room.snarkel.rewardsEnabled || room.snarkel.rewards.length === 0) {
      console.log('No rewards configured for this snarkel');
      return NextResponse.json({
        success: true,
        message: 'No rewards to distribute',
        distributed: false
      });
    }

    // Get admin wallet private key from environment
    const adminPrivateKey = process.env.ADMIN_WALLET;
    if (!adminPrivateKey) {
      console.error('ADMIN_WALLET environment variable is not set');
      return NextResponse.json({
        success: false,
        error: 'Admin wallet not configured. Please set the ADMIN_WALLET environment variable.',
        details: 'This is required for automatic reward distribution to work.'
      }, { status: 500 });
    }

    // Create admin account from private key
    const adminAccount = privateKeyToAccount(adminPrivateKey as `0x${string}`);
    
    // Determine chain from snarkel reward config
    const firstUndistributed = room.snarkel.rewards[0];
    const chainId = firstUndistributed?.chainId || 42220;

    const chain = (() => {
      switch (chainId) {
        case 42220: return celo;
        case 8453: return base;
        case 8453: return base;
        case 84532:
        case 84531: return baseSepolia;
        default: return celo;
      }
    })();

    // Create wallet/public clients on selected chain
    const walletClient = createWalletClient({
      account: adminAccount,
      chain,
      transport: http()
    });

    const publicClient = createPublicClient({
      chain,
      transport: http()
    });

    console.log('Found admin wallet:', adminAccount.address);

    // Resolve contract address per chain
    const CONTRACTS: Record<number, string> = {
      42220: process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS_CELO || '0x8b8fb708758dc8185ef31e685305c1aa0827ea65',
      8453: process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS_BASE || '0xd2c5d1cf9727da34bcb6465890e4fb5c413bbd40',
      84532: process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS_BASE || '0xd2c5d1cf9727da34bcb6465890e4fb5c413bbd40',
      84531: process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS_BASE || '0xd2c5d1cf9727da34bcb6465890e4fb5c413bbd40'
    };
    
    // Check if we have contract addresses configured
    const missingContracts = Object.entries(CONTRACTS)
      .filter(([chainId, address]) => !address || address === '0x...')
      .map(([chainId]) => chainId);
    
    if (missingContracts.length > 0) {
      console.warn(`Missing contract addresses for chains: ${missingContracts.join(', ')}`);
    }
    
    const contractAddress = CONTRACTS[chain.id];
    if (!contractAddress || contractAddress === '0x...') {
      return NextResponse.json({
        success: false,
        error: `Contract address not configured for chain ${chain.id}`,
        details: 'Please configure the appropriate contract address environment variable.',
        code: 'MISSING_CONTRACT_ADDRESS'
      }, { status: 500 });
    }

    // Process each reward
    const distributionResults = [];

    for (const reward of room.snarkel.rewards) {
      try {
        console.log(`Processing reward: ${reward.tokenSymbol} (${reward.tokenAddress})`);

        // Get user details for leaderboard
        const leaderboardWithUsers = await Promise.all(
          finalLeaderboard.map(async (participant) => {
            const user = await prisma.user.findUnique({
              where: { id: participant.userId }
            });

            if (!user) {
              console.log(`User not found for participant: ${participant.userId}`);
              return null;
            }

            return {
              userId: participant.userId,
              walletAddress: user.address,
              score: participant.score,
              position: 0, // Will be calculated
              timeBonus: 0,
              finalPoints: participant.score
            };
          })
        );

        // Filter out null entries and sort by score
        const validLeaderboard = leaderboardWithUsers
          .filter(entry => entry !== null)
          .sort((a, b) => b.score - a.score)
          .map((entry, index) => ({
            ...entry,
            position: index + 1
          }));

        if (validLeaderboard.length === 0) {
          console.log('No valid participants for reward distribution');
          continue;
        }

        // Create submission records for participants
        const submissionRecords = await Promise.all(
          validLeaderboard.map(async (participant) => {
            return prisma.submission.create({
              data: {
                score: participant.score,
                totalPoints: participant.score,
                totalQuestions: room.snarkel.questions?.length || 0,
                timeSpent: 0,
                completedAt: new Date(),
                userId: participant.userId,
                snarkelId: room.snarkelId
              }
            });
          })
        );

        // Call smart contract to distribute rewards
        const snarkelContract = {
          address: getAddress(contractAddress),
          abi: SNARKEL_ABI
        };

        try {
          console.log(`Calling distributeRewards for session ${sessionNumber}, token ${reward.tokenAddress}`);
          
          // Use the existing distributeRewards function that distributes to all participants at once
          const hash = await walletClient.writeContract({
            ...snarkelContract,
            functionName: 'distributeRewards',
            args: [
              BigInt(sessionNumber),
              getAddress(reward.tokenAddress)
            ],
            dataSuffix: getReferralDataSuffix()
          });
          
          console.log(`Transaction submitted: ${hash}`);
          
          // Wait for transaction confirmation
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          submitDivviReferral(hash as Hex, chain.id).catch(() => {});
          console.log(`Transaction confirmed: ${hash}`);
          
                  // Calculate reward distribution based on configuration
        let distributionAmounts: Array<{ userId: string; amount: number; position: number }> = [];
        
        if (reward.rewardAllParticipants) {
          // Reward all participants using quadratic formula
          const totalPool = parseFloat(reward.totalRewardPool || '0');
          const totalParticipants = validLeaderboard.length;
          
          // Use quadratic funding formula: amount = (score^2 / total_score^2) * total_pool
          const totalScoreSquared = validLeaderboard.reduce((sum, p) => sum + Math.pow(p.score, 2), 0);
          
          distributionAmounts = validLeaderboard.map(participant => {
            const scoreSquared = Math.pow(participant.score, 2);
            const amount = totalScoreSquared > 0 ? (scoreSquared / totalScoreSquared) * totalPool : 0;
            return {
              userId: participant.userId,
              amount: Math.max(0, amount),
              position: participant.position
            };
          });
        } else {
          // Reward only top winners
          const totalWinners = reward.totalWinners || 5;
          const topWinners = validLeaderboard.slice(0, totalWinners);
          const totalPool = parseFloat(reward.totalRewardPool || '0');
          
          // Use predefined reward amounts if available, otherwise distribute proportionally
          if (reward.rewardAmounts && Array.isArray(reward.rewardAmounts) && reward.rewardAmounts.length > 0) {
            distributionAmounts = topWinners.map((participant, index) => {
              const rewardAmount = (reward.rewardAmounts as number[])[index] || 0;
              const amount = (rewardAmount / 100) * totalPool; // Convert percentage to amount
              return {
                userId: participant.userId,
                amount: Math.max(0, amount),
                position: participant.position
              };
            });
          } else {
            // Proportional distribution among top winners
            const totalScore = topWinners.reduce((sum, p) => sum + p.score, 0);
            distributionAmounts = topWinners.map(participant => {
              const amount = totalScore > 0 ? (participant.score / totalScore) * totalPool : 0;
              return {
                userId: participant.userId,
                amount: Math.max(0, amount),
                position: participant.position
              };
            });
          }
        }
        
        // Create reward distribution records in database
        for (const distribution of distributionAmounts) {
          await prisma.rewardDistribution.create({
            data: {
              position: distribution.position,
              amount: distribution.amount.toString(),
              txHash: hash,
              isProcessed: true,
              processedAt: new Date(),
              rewardId: reward.id,
              userId: distribution.userId,
              submissionId: submissionRecords.find(s => s.userId === distribution.userId)?.id || ''
            }
          });
        }

          // Update reward as distributed
          await prisma.snarkelReward.update({
            where: { id: reward.id },
            data: {
              isDistributed: true,
              distributedAt: new Date()
            }
          });

          distributionResults.push({
            rewardId: reward.id,
            tokenSymbol: reward.tokenSymbol,
            tokenAddress: reward.tokenAddress,
            totalAmount: reward.totalRewardPool || 0,
            amountPerParticipant: parseFloat(reward.totalRewardPool || '0') / validLeaderboard.length,
            participants: validLeaderboard.length,
            distributions: validLeaderboard.length,
            successfulTransfers: validLeaderboard.length,
            failedTransfers: 0,
            totalDistributed: reward.totalRewardPool || '0',
            transactionHash: hash
          });

          console.log(`Successfully distributed rewards for ${reward.tokenSymbol}`);

        } catch (error: any) {
          console.error(`Failed to distribute rewards for ${reward.tokenSymbol}:`, error);
          
          distributionResults.push({
            rewardId: reward.id,
            tokenSymbol: reward.tokenSymbol,
            tokenAddress: reward.tokenAddress,
            error: error.message
          });
        }

      } catch (error: any) {
        console.error(`Error processing reward ${reward.tokenSymbol}:`, error);
        distributionResults.push({
          rewardId: reward.id,
          tokenSymbol: reward.tokenSymbol,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Automatic reward distribution completed',
      distributed: distributionResults.length > 0,
      results: distributionResults
    });

  } catch (error: any) {
    console.error('Error in automatic reward distribution:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to distribute rewards automatically',
      details: error.message
    }, { status: 500 });
  }
} 