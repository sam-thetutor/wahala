import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client/index';
import { getFeaturedSnarkels } from '@/lib/snarkel-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const featuredSnarkels = await getFeaturedSnarkels(limit);

    const response = featuredSnarkels.map((snarkel: any) => ({
      id: snarkel.id,
      title: snarkel.title,
      description: snarkel.description,
      snarkelCode: snarkel.snarkelCode,
      creator: snarkel.creator.address,
      totalQuestions: snarkel._count.questions,
      totalParticipants: snarkel._count.submissions,
      isActive: snarkel.isActive,
      startTime: snarkel.startTime,
      costCelo: snarkel.costCelo,
      spamControlEnabled: snarkel.spamControlEnabled,
      entryFee: snarkel.spamControlEnabled ? {
        amount: snarkel.entryFeeAmount,
        symbol: snarkel.entryFeeTokenSymbol
      } : null,
      priority: snarkel.featuredContent?.priority || 0
    }));

    return NextResponse.json({ featuredSnarkels: response });
  } catch (error) {
    console.error('Featured snarkels error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch featured snarkels' },
      { status: 500 }
    );
  }
} 