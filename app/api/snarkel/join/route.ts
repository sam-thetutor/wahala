import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidWalletAddress } from '@/lib/wallet-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { snarkelCode, walletAddress } = body;

    if (!snarkelCode || !walletAddress) {
      return NextResponse.json(
        { error: 'Snarkel code and wallet address are required' },
        { status: 400 }
      );
    }

    // Enhanced wallet address validation
    if (!isValidWalletAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Find the snarkel by code
    const snarkel = await prisma.snarkel.findUnique({
      where: { snarkelCode },
      include: {
        questions: {
          select: {
            id: true
          }
        },
        allowlist: true,
        rooms: {
          include: {
            participants: {
              include: {
                user: true
              }
            }
          }
        },
        creator: true
      }
    });

    if (!snarkel) {
      return NextResponse.json(
        { error: 'Snarkel not found' },
        { status: 404 }
      );
    }

    // Check if snarkel is active
    if (!snarkel.isActive) {
      return NextResponse.json(
        { error: 'This snarkel is not active' },
        { status: 400 }
      );
    }

    // Check if user is allowed to join (for private snarkels)
    if (!snarkel.isPublic) {
      const isAllowed = snarkel.allowlist?.some(
        (allowlistItem: any) => allowlistItem.address.toLowerCase() === walletAddress.toLowerCase()
      ) || false;
      
      if (!isAllowed) {
        return NextResponse.json(
          { error: 'You are not allowed to join this private snarkel' },
          { status: 403 }
        );
      }
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address: walletAddress.toLowerCase() },
      select: {
        id: true,
        address: true,
        name: true,
        isVerified: true,
        verificationMethod: true,
        verifiedAt: true,
        country: true,
        nationality: true,
        dateOfBirth: true,
        gender: true,
        totalPoints: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          address: walletAddress.toLowerCase(),
          name: `User ${walletAddress.slice(0, 8)}...`,
          totalPoints: 0
        }
      });
    }

    // NEW: Check verification requirements
    if (snarkel.requireVerification && !user.isVerified) {
      return NextResponse.json({
        verificationRequired: true,
        message: 'Identity verification required to join this quiz',
        snarkel: {
          id: snarkel.id,
          title: snarkel.title,
          requireVerification: snarkel.requireVerification,
          minAge: snarkel.minAge,
          allowedCountries: snarkel.allowedCountries,
          excludedCountries: snarkel.excludedCountries,
        }
      }, { status: 403 });
    }

    // Check age requirement if verification is required
    if (snarkel.requireVerification && snarkel.minAge && user.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < snarkel.minAge) {
        return NextResponse.json({
          verificationRequired: true,
          message: `Minimum age ${snarkel.minAge} required. You are ${age} years old.`,
          snarkel: {
            id: snarkel.id,
            title: snarkel.title,
            requireVerification: snarkel.requireVerification,
            minAge: snarkel.minAge,
          }
        }, { status: 403 });
      }
    }

    // Check country restrictions if verification is required
    if (snarkel.requireVerification && user.country) {
      if (snarkel.excludedCountries && snarkel.excludedCountries.includes(user.country)) {
        return NextResponse.json({
          verificationRequired: true,
          message: `Users from ${user.country} cannot join this quiz.`,
          snarkel: {
            id: snarkel.id,
            title: snarkel.title,
            requireVerification: snarkel.requireVerification,
            excludedCountries: snarkel.excludedCountries,
          }
        }, { status: 403 });
      }
      
      if (snarkel.allowedCountries && snarkel.allowedCountries.length > 0 && !snarkel.allowedCountries.includes(user.country)) {
        return NextResponse.json({
          verificationRequired: true,
          message: `Users from ${user.country} are not in the allowed countries list.`,
          snarkel: {
            id: snarkel.id,
            title: snarkel.title,
            requireVerification: snarkel.requireVerification,
            allowedCountries: snarkel.allowedCountries,
          }
        }, { status: 403 });
      }
    }

    // Find active room or create new one
    let room = await prisma.room.findFirst({
      where: {
        snarkelId: snarkel.id,
        isActive: true,
        isFinished: false
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        admin: true
      },
      orderBy: {
        sessionNumber: 'desc'
      }
    });
    
    if (!room) {
      // Get the next session number
      const lastRoom = await prisma.room.findFirst({
        where: { snarkelId: snarkel.id },
        orderBy: { sessionNumber: 'desc' }
      });
      
      const nextSessionNumber = (lastRoom?.sessionNumber || 0) + 1;
      
      room = await prisma.room.create({
        data: {
          name: `${snarkel.title} Session ${nextSessionNumber}`,
          description: `Room for ${snarkel.title} - Session ${nextSessionNumber}`,
          maxParticipants: 50,
          currentParticipants: 0,
          isActive: true,
          isWaiting: true,
          isStarted: false,
          isFinished: false,
          minParticipants: 1,
          autoStartEnabled: false,
          countdownDuration: 10,
          // For featured quizzes, the first person to join becomes the admin
          // For regular quizzes, the creator is always the admin
          adminId: snarkel.isFeatured ? user.id : snarkel.creatorId,
          snarkelId: snarkel.id,
          sessionNumber: nextSessionNumber
        },
        include: {
          participants: {
            include: {
              user: true
            }
          },
          admin: true
        }
      });
    }

    // Check if user is already in the room
    const existingParticipant = room?.participants?.find(
      p => p.user.address.toLowerCase() === walletAddress.toLowerCase()
    ) || null;

    if (existingParticipant) {
      return NextResponse.json({
        success: true,
        roomId: room?.id,
        snarkelId: snarkel.id,
        snarkelCode: snarkel.snarkelCode,
        message: 'Already in room',
        isAdmin: existingParticipant.isAdmin,
        isReady: existingParticipant.isReady,
        room: {
          id: room?.id,
          name: room?.name,
          currentParticipants: room?.currentParticipants,
          maxParticipants: room?.maxParticipants,
          minParticipants: room?.minParticipants,
          isWaiting: room?.isWaiting,
          isStarted: room?.isStarted,
          isFinished: room?.isFinished,
          countdownDuration: room?.countdownDuration
        },
        snarkel: {
          id: snarkel.id,
          title: snarkel.title,
          description: snarkel.description,
          totalQuestions: snarkel.questions?.length || 0,
          basePointsPerQuestion: snarkel.basePointsPerQuestion,
          speedBonusEnabled: snarkel.speedBonusEnabled,
          maxSpeedBonus: snarkel.maxSpeedBonus
        },
        participants: room?.participants?.map(p => ({
          id: p.id,
          userId: p.userId,
          isAdmin: p.isAdmin,
          isReady: p.isReady,
          joinedAt: p.joinedAt.toISOString(),
          user: {
            id: p.user.id,
            address: p.user.address,
            name: p.user.name || ''
          }
        })) || [],
        snarkelCreatorAddress: snarkel.creator?.address
      });
    }

    // Check if room is full
    if (room?.currentParticipants && room?.maxParticipants && room.currentParticipants >= room.maxParticipants) {
      return NextResponse.json(
        { error: 'Room is full' },
        { status: 400 }
      );
    }

    // Check if user is the creator (admin) of the snarkel OR if it's the first person joining a featured quiz (session starter)
    const isSnarkelCreator = snarkel.creator?.address?.toLowerCase() === walletAddress.toLowerCase();
    const isFeaturedQuiz = snarkel.isFeatured;
    const isFirstPersonJoiningFeatured = isFeaturedQuiz && (!room || room.currentParticipants === 0);
    const isAdmin = isSnarkelCreator || isFirstPersonJoiningFeatured;
    
    console.log('Admin check:', {
      creatorAddress: snarkel.creator?.address,
      walletAddress: walletAddress,
      isSnarkelCreator: isSnarkelCreator,
      isFeaturedQuiz: isFeaturedQuiz,
      isAdmin: isAdmin
    });


    
    // Add user to room
    const participant = await prisma.roomParticipant.create({
      data: {
        roomId: room?.id || '',
        userId: user.id,
        isReady: false,
        isAdmin: isAdmin
      },
      include: {
        user: true
      }
    });

    // Update room participant count
    if (room?.id) {
      await prisma.room.update({
        where: { id: room.id },
        data: {
          currentParticipants: (room.currentParticipants || 0) + 1
        }
      });
    }

    // Check if this is the first person joining a featured quiz (session starter)
    const isSessionStarter = snarkel.isFeatured && room?.currentParticipants === 0;

                    return NextResponse.json({
            success: true,
            roomId: room?.id,
            snarkelId: snarkel.id,
            snarkelCode: snarkel.snarkelCode,
            message: isSessionStarter ? 'You started a featured quiz session!' : 'Successfully joined room',
            isAdmin: participant.isAdmin,
            isReady: participant.isReady,
            isSessionStarter: isSessionStarter,
        room: {
          id: room?.id,
          name: room?.name,
          currentParticipants: (room?.currentParticipants || 0) + 1,
          maxParticipants: room?.maxParticipants,
          minParticipants: room?.minParticipants,
          isWaiting: room?.isWaiting,
          isStarted: room?.isStarted,
          isFinished: room?.isFinished,
          countdownDuration: room?.countdownDuration
        },
        snarkel: {
          id: snarkel.id,
          title: snarkel.title,
          description: snarkel.description,
          totalQuestions: snarkel.questions?.length || 0,
          basePointsPerQuestion: snarkel.basePointsPerQuestion,
          speedBonusEnabled: snarkel.speedBonusEnabled,
          maxSpeedBonus: snarkel.maxSpeedBonus
        },
        participants: [],
        snarkelCreatorAddress: snarkel.creator?.address
      });

  } catch (error: any) {
    console.error('Error joining snarkel:', error);
    
    return NextResponse.json(
      { error: 'Failed to join snarkel' },
      { status: 500 }
    );
  }
} 