import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { snarkelCode, skipVerification } = await request.json();

    if (!snarkelCode) {
      return NextResponse.json(
        { error: 'Snarkel code is required' },
        { status: 400 }
      );
    }

    // Find the snarkel
    const snarkel = await prisma.snarkel.findFirst({
      where: { snarkelCode: snarkelCode },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    if (!snarkel) {
      return NextResponse.json(
        { error: 'Snarkel not found' },
        { status: 404 }
      );
    }

    if (!snarkel.isActive) {
      return NextResponse.json(
        { error: 'This snarkel is not active' },
        { status: 400 }
      );
    }

    // Check if verification is required
    if (snarkel.requireVerification && !skipVerification) {
      return NextResponse.json({
        verificationRequired: true,
        snarkelId: snarkel.id,
        message: 'This quiz requires identity verification'
      });
    }

    // Check if user is already a participant
    const existingParticipant = snarkel.participants.find(
      p => p.user.id === 'user123' // This should come from your auth system
    );

    if (existingParticipant) {
      return NextResponse.json({
        error: 'You are already a participant in this snarkel'
      }, { status: 400 });
    }

    // Check if max participants reached
    if (snarkel.maxParticipants && snarkel.participants.length >= snarkel.maxParticipants) {
      return NextResponse.json({
        error: 'Maximum participants reached for this snarkel'
      }, { status: 400 });
    }

    // Add user as participant
    const participant = await prisma.participant.create({
      data: {
        snarkelId: snarkel.id,
        userId: 'user123', // This should come from your auth system
        joinedAt: new Date(),
        points: 0
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully joined snarkel',
      snarkelId: snarkel.id,
      roomId: snarkel.id, // For now, use snarkel ID as room ID
      participant
    });

  } catch (error: any) {
    console.error('Join snarkel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 