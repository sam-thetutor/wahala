import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client/edge';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({
        snarkels: [],
        message: 'No snarkels found for this wallet address'
      });
    }

    // Fetch snarkels created by this user
               const snarkels = await prisma.snarkel.findMany({
             where: {
               creatorId: user.id
             },
             select: {
               id: true,
               title: true,
               description: true,
               snarkelCode: true,
               isActive: true,
               isPublic: true,
               createdAt: true,
               basePointsPerQuestion: true,
               speedBonusEnabled: true,
               maxSpeedBonus: true,
               spamControlEnabled: true,
               entryFeeAmount: true,
               entryFeeTokenAddress: true,
               autoStartEnabled: true,
               startTime: true,
               questions: {
                 select: {
                   id: true
                 }
               },
               allowlist: {
                 select: {
                   id: true
                 }
               },
               rewards: {
                 select: {
                   id: true,
                   isDistributed: true
                 }
               },
               submissions: {
                 select: {
                   id: true,
                   score: true,
                   totalPoints: true
                 }
               },
               creator: {
                 select: {
                   id: true,
                   address: true,
                   name: true
                 }
               }
             },
             orderBy: {
               createdAt: 'desc'
             }
           });

    // Transform the data to match the frontend interface
    const transformedSnarkels = snarkels.map(snarkel => {
      // Calculate statistics
      const totalSubmissions = snarkel.submissions.length;
      const totalParticipants = new Set(snarkel.submissions.map(s => s.id)).size; // This should be userId, but we're using submission id for now
      const averageScore = totalSubmissions > 0 
        ? Math.round(snarkel.submissions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSubmissions)
        : 0;
      const totalRewardsDistributed = snarkel.rewards.filter(r => r.isDistributed).length;

                   return {
               id: snarkel.id,
               title: snarkel.title,
               description: snarkel.description || '',
               snarkelCode: snarkel.snarkelCode,
               isActive: snarkel.isActive,
               isPublic: snarkel.isPublic,
               createdAt: snarkel.createdAt.toISOString(),
               totalQuestions: snarkel.questions.length,
               basePointsPerQuestion: snarkel.basePointsPerQuestion,
               speedBonusEnabled: snarkel.speedBonusEnabled,
               maxSpeedBonus: snarkel.maxSpeedBonus,
               spamControlEnabled: snarkel.spamControlEnabled,
               entryFee: snarkel.entryFeeAmount || '0',
               entryFeeToken: snarkel.entryFeeTokenAddress || '',
               allowlistCount: snarkel.allowlist.length,
               hasRewards: snarkel.rewards.length > 0,
               autoStartEnabled: snarkel.autoStartEnabled || false,
               scheduledStartTime: snarkel.startTime?.toISOString() || null,
               creator: {
                 id: snarkel.creator.id,
                 address: snarkel.creator.address,
                 name: snarkel.creator.name || ''
               },
               stats: {
                 totalParticipants,
                 totalSubmissions,
                 averageScore,
                 totalRewardsDistributed
               }
             };
    });

    return NextResponse.json({
      snarkels: transformedSnarkels,
      total: transformedSnarkels.length
    });

  } catch (error: any) {
    console.error('Error fetching user snarkels:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch snarkels' },
      { status: 500 }
    );
  }
} 