import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client/edge';
import { generateSnarkelCode, validateSnarkelSettings, validateRewardSettings } from '@/lib/snarkel-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      basePointsPerQuestion,
      maxSpeedBonus,
      speedBonusEnabled,
      maxQuestions,
      isPublic,
      allowlist,
      spamControlEnabled,
      entryFee,
      entryFeeToken,
      creatorAddress,
      rewards,
      questions,
      startTime,
      autoStartEnabled,
      redCode
    } = body;

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Validate wallet connection
    if (!creatorAddress) {
      return NextResponse.json(
        { error: 'Wallet connection is required to create a snarkel' },
        { status: 401 }
      );
    }

    // Validate start time if provided
    if (startTime) {
      const startTimeDate = new Date(startTime);
      const now = new Date();
      
      if (isNaN(startTimeDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start time format' },
          { status: 400 }
        );
      }
      
      if (startTimeDate <= now) {
        return NextResponse.json(
          { error: 'Start time must be in the future' },
          { status: 400 }
        );
      }
    }

    // Validate auto-start settings
    if (autoStartEnabled && !startTime) {
      return NextResponse.json(
        { error: 'Start time is required when auto-start is enabled' },
        { status: 400 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      );
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.text || question.text.trim() === '') {
        return NextResponse.json(
          { error: `Question ${i + 1} text is required` },
          { status: 400 }
        );
      }

      const validOptions = question.options.filter((opt: any) => opt.text && opt.text.trim() !== '');
      if (validOptions.length < 2) {
        return NextResponse.json(
          { error: `Question ${i + 1} needs at least 2 options` },
          { status: 400 }
        );
      }

      const correctOptions = validOptions.filter((opt: any) => opt.isCorrect);
      if (correctOptions.length === 0) {
        return NextResponse.json(
          { error: `Question ${i + 1} needs at least one correct answer` },
          { status: 400 }
        );
      }
    }

    // Validate snarkel settings
    const snarkelValidation = validateSnarkelSettings({
      title,
      basePointsPerQuestion,
      maxSpeedBonus,
      maxQuestions
    });

    if (!snarkelValidation.isValid) {
      return NextResponse.json(
        { error: snarkelValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Validate reward settings if enabled
    if (rewards.enabled) {
      const rewardValidation = validateRewardSettings(rewards);
      if (!rewardValidation.isValid) {
        return NextResponse.json(
          { error: rewardValidation.errors.join(', ') },
          { status: 400 }
        );
      }
    }

    // Generate unique snarkel code
    const snarkelCode = await generateSnarkelCode();

    // Find or create user based on wallet address
    let user = await prisma.user.findUnique({
      where: { address: creatorAddress.toLowerCase() }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          address: creatorAddress.toLowerCase(),
          name: `User ${creatorAddress.slice(0, 8)}...`,
          totalPoints: 0
        }
      });
    }

    // Create snarkel
    const snarkel = await prisma.snarkel.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        snarkelCode: redCode || snarkelCode, // Use red code if provided, otherwise generate
        startTime: startTime ? new Date(startTime) : null,
        autoStartEnabled: autoStartEnabled || false,
        basePointsPerQuestion,
        maxSpeedBonus,
        speedBonusEnabled,
        maxQuestions,
        isPublic,
        isActive: true,
        isFeatured: false,
        spamControlEnabled,
        entryFeeAmount: spamControlEnabled ? entryFee.toString() : '0',
        entryFeeTokenAddress: spamControlEnabled ? entryFeeToken : '',
        creatorId: user.id,
        questions: {
          create: questions.map((q: any, index: number) => ({
            text: q.text.trim(),
            order: index + 1,
            points: basePointsPerQuestion,
            timeLimit: q.timeLimit || 15,
            options: {
              create: q.options
                .filter((opt: any) => opt.text && opt.text.trim() !== '')
                .map((opt: any, optIndex: number) => ({
                  text: opt.text.trim(),
                  isCorrect: opt.isCorrect,
                  order: optIndex + 1
                }))
            }
          }))
        },
        allowlist: isPublic ? undefined : {
          create: allowlist.map((address: string) => ({
            address: address.trim()
          }))
        }
      },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        allowlist: true
      }
    });

    // Create reward settings if enabled
    if (rewards.enabled) {
      await prisma.snarkelReward.create({
        data: {
          rewardType: rewards.type,
          tokenAddress: rewards.tokenAddress,
          tokenSymbol: 'CELO', // Default token symbol
          tokenName: 'Celo Native Token', // Default token name
          tokenDecimals: 18, // Default decimals
          network: 'Celo', // Default network
          totalWinners: rewards.type === 'LINEAR' ? rewards.totalWinners : undefined,
          rewardAmounts: rewards.type === 'LINEAR' ? rewards.rewardAmounts : undefined,
          totalRewardPool: rewards.type === 'QUADRATIC' ? rewards.totalRewardPool : undefined,
          minParticipants: rewards.type === 'QUADRATIC' ? rewards.minParticipants : undefined,
          pointsWeight: rewards.type === 'QUADRATIC' ? rewards.pointsWeight : undefined,
          snarkelId: snarkel.id
        }
      });
    }

    // Link allowlist addresses to users if they exist
    if (!isPublic && allowlist.length > 0) {
      for (const address of allowlist) {
        const allowlistUser = await prisma.user.findUnique({
          where: { address: address.trim().toLowerCase() }
        });
        
        if (allowlistUser) {
          await prisma.snarkelAllowlist.updateMany({
            where: {
              snarkelId: snarkel.id,
              address: address.trim()
            },
            data: {
              userId: allowlistUser.id
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      snarkelCode: snarkel.snarkelCode,
      snarkel: {
        id: snarkel.id,
        title: snarkel.title,
        description: snarkel.description,
        startTime: snarkel.startTime,
        autoStartEnabled: snarkel.autoStartEnabled,
        totalQuestions: snarkel.questions.length,
        basePointsPerQuestion: snarkel.basePointsPerQuestion,
        speedBonusEnabled: snarkel.speedBonusEnabled,
        maxSpeedBonus: snarkel.maxSpeedBonus,
        isPublic: snarkel.isPublic,
        spamControlEnabled: snarkel.spamControlEnabled,
        entryFee: snarkel.entryFeeAmount,
        entryFeeToken: snarkel.entryFeeTokenAddress,
        allowlistCount: snarkel.allowlist.length,
        hasRewards: rewards.enabled,
        creator: {
          id: user.id,
          address: user.address,
          name: user.name
        }
      }
    });

  } catch (error: any) {
    console.error('Error creating snarkel:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Database constraint error. Please check your input and try again.' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A snarkel with this title already exists. Please choose a different title.' },
        { status: 409 }
      );
    }
    
    // Handle other database errors
    if (error.code && error.code.startsWith('P')) {
      return NextResponse.json(
        { error: 'Database error occurred. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create snarkel. Please try again.' },
      { status: 500 }
    );
  }
} 