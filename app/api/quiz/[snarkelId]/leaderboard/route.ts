import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ snarkelId: string }> }
) {
  try {
    const { snarkelId } = await params;
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!snarkelId) {
      return NextResponse.json(
        { success: false, error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    // Fetch quiz information with rewards and creator
    const quiz = await prisma.snarkel.findFirst({
      where: { 
        OR: [
          { id: snarkelId },
          { snarkelCode: snarkelId }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            address: true,
            name: true
          }
        },
        questions: {
          select: {
            id: true,
            text: true,
            points: true,
            timeLimit: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        rewards: {
          where: {
            isDistributed: false
          },
          select: {
            id: true,
            tokenAddress: true,
            tokenSymbol: true,
            tokenName: true,
            totalRewardPool: true,
            isDistributed: true,
            distributedAt: true,
            totalWinners: true,
            rewardAmounts: true,
            minParticipants: true,
            network: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Calculate max possible score from questions
    let maxPossibleScore = 0;
    if (quiz.questions.length > 0) {
      maxPossibleScore = quiz.questions.reduce((total: number, question: { points: number }) => total + question.points, 0);
    }

    // Fetch all submissions for this quiz with detailed answer information
    const submissions = await prisma.submission.findMany({
      where: {
        snarkelId: quiz.id,
        score: { gt: 0 } // Only include submissions with scores
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        answers: {
          select: {
            id: true,
            questionId: true,
            isCorrect: true,
            timeToAnswer: true,
            pointsEarned: true,
            selectedOptions: true
          }
        }
      },
      orderBy: {
        score: 'desc'
      }
    });

    // Fetch questions with options for question breakdown
    const questions = await prisma.question.findMany({
      where: {
        snarkelId: quiz.id
      },
      include: {
        options: {
          select: {
            id: true,
            text: true,
            isCorrect: true
          }
        }
      }
    });

    // Process submissions to create enhanced leaderboard
    const leaderboard = submissions.map((submission: any, index) => {
      const correctAnswers = submission.answers.filter((answer: any) => answer.isCorrect).length;
      const totalQuestions = submission.answers.length;
      
      // Calculate average time per question
      const validTimes = submission.answers
        .filter((answer: any) => answer.timeToAnswer !== null)
        .map((answer: any) => answer.timeToAnswer!);
      
      const averageTimePerQuestion = validTimes.length > 0 
        ? validTimes.reduce((sum: number, time: number) => sum + time, 0) / validTimes.length
        : null;

      // Calculate time bonus (if applicable)
      let timeBonus = 0;
      if (quiz.basePointsPerQuestion && validTimes.length > 0) {
        // Simple time bonus calculation - can be enhanced based on your scoring logic
        const avgTime = averageTimePerQuestion || 0;
        if (avgTime < 10) { // Less than 10 seconds average
          timeBonus = Math.round(quiz.basePointsPerQuestion * 0.1); // 10% bonus
        }
      }

      // Create detailed question breakdown
      const questionBreakdown = submission.answers.map((answer: any) => {
        const question = questions.find(q => q.id === answer.questionId);
        return {
          questionId: answer.questionId,
          questionText: question?.text || 'Unknown Question',
          isCorrect: answer.isCorrect,
          pointsEarned: answer.pointsEarned || 0,
          timeToAnswer: answer.timeToAnswer,
          timeLimit: question?.timeLimit || 0,
          selectedOptions: answer.selectedOptions,
          correctOption: question?.options?.find((opt: any) => opt.isCorrect)?.text || 'Unknown',
          maxPoints: question?.points || 0
        };
      });

      return {
        userId: submission.user.id,
        name: submission.user.name || submission.user.address.slice(0, 6) + '...' + submission.user.address.slice(-4),
        score: submission.score,
        position: index + 1,
        walletAddress: submission.user.address,
        timeBonus,
        totalQuestions,
        correctAnswers,
        averageTimePerQuestion,
        completedAt: submission.completedAt.toISOString(),
        questionBreakdown,
        accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
      };
    });

    // Get total participants count
    const totalParticipants = await prisma.submission.count({
      where: {
        snarkelId: quiz.id,
        score: { gt: 0 }
      }
    });

    // Check if connected wallet is admin (quiz creator)
    let isAdmin = false;
    let adminDetails = null;
    
    if (walletAddress) {
      isAdmin = quiz.creator.address.toLowerCase() === walletAddress.toLowerCase();
      
      if (isAdmin) {
        adminDetails = {
          isQuizCreator: true,
          creatorAddress: quiz.creator.address,
          creatorName: quiz.creator.name
        };
      }
    }

    // Check if rewards are available and not distributed
    const hasRewards = quiz.rewards.length > 0;
    const undistributedRewards = quiz.rewards.filter((reward: any) => !reward.isDistributed);
    const canDistributeRewards = isAdmin && hasRewards && undistributedRewards.length > 0;

    // Prepare quiz info with enhanced data
    const quizInfo = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      snarkelCode: quiz.snarkelCode,
      maxPossibleScore,
      totalParticipants,
      hasRewards,
      rewards: quiz.rewards,
      canDistributeRewards,
      totalQuestions: quiz.questions.length,
      questions: quiz.questions
    };

    return NextResponse.json({
      success: true,
      leaderboard,
      quizInfo,
      isAdmin,
      adminDetails
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
