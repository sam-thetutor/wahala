import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ snarkelId: string }> }
) {
  try {
    const { snarkelId } = await params;

    if (!snarkelId) {
      return NextResponse.json(
        { success: false, error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    // Fetch quiz information
    const quiz = await prisma.snarkel.findFirst({
      where: { 
        OR: [
          { id: snarkelId },
          { snarkelCode: snarkelId }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        snarkelCode: true,
        maxPossibleScore: true,
        isCompleted: true,
        completedAt: true,
        basePointsPerQuestion: true,
        questions: {
          select: {
            id: true,
            points: true
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

    // Calculate max possible score if not set
    let maxPossibleScore = quiz.maxPossibleScore;
    if (!maxPossibleScore && quiz.questions.length > 0) {
      maxPossibleScore = quiz.questions.reduce((total: number, question: { points: number }) => total + question.points, 0);
    }

    // Fetch all submissions for this quiz
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
            isCorrect: true,
            timeToAnswer: true,
            pointsEarned: true
          }
        }
      },
      orderBy: {
        score: 'desc'
      }
    });

    // Process submissions to create leaderboard
    const leaderboard = submissions.map((submission: any, index: number) => {
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
        completedAt: submission.completedAt.toISOString()
      };
    });

    // Get total participants count
    const totalParticipants = await prisma.submission.count({
      where: {
        snarkelId: quiz.id,
        score: { gt: 0 }
      }
    });

    // Prepare quiz info
    const quizInfo = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      snarkelCode: quiz.snarkelCode,
      maxPossibleScore,
      totalParticipants,
      isCompleted: quiz.isCompleted,
      completedAt: quiz.completedAt?.toISOString()
    };

    return NextResponse.json({
      success: true,
      leaderboard,
      quizInfo
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
