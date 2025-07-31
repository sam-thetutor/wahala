import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client/edge';
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
        room: {
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
      const isAllowed = snarkel.allowlist.some(
        allowlistItem => allowlistItem.address.toLowerCase() === walletAddress.toLowerCase()
      );
      
      if (!isAllowed) {
        return NextResponse.json(
          { error: 'You are not allowed to join this private snarkel' },
          { status: 403 }
        );
      }
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address: walletAddress.toLowerCase() }
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

    // Check if room exists, create if not
    let room = snarkel.room;
    
    if (!room) {
      room = await prisma.room.create({
        data: {
          name: `${snarkel.title} Room`,
          description: `Room for ${snarkel.title}`,
          maxParticipants: 50,
          currentParticipants: 0,
          isActive: true,
          isWaiting: true,
          isStarted: false,
          isFinished: false,
          minParticipants: 1,
          autoStartEnabled: false,
          countdownDuration: 10,
          adminId: snarkel.creatorId,
          snarkelId: snarkel.id
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
    } else {
      // If room exists, fetch it with admin relation
      room = await prisma.room.findUnique({
        where: { id: room.id },
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

    // Check if user is the creator (admin) of the snarkel
   
    //console log isAdmin and all teh details and ids
    console.log('isAdmin');
    console.log('room.adminId', room?.adminId);
    console.log('user.id', user.id);
    //maybe for is admin user the admin id vs connecedt wallet address
    const isAdmin = room?.adminId === user.id;
    console.log('isAdmin', isAdmin);


    
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

          return NextResponse.json({
        success: true,
        roomId: room?.id,
        snarkelId: snarkel.id,
        snarkelCode: snarkel.snarkelCode,
        message: 'Successfully joined room',
        isAdmin: participant.isAdmin,
        isReady: participant.isReady,
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