import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, snarkelId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user verification status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isVerified: true,
        verificationMethod: true,
        verifiedAt: true,
        country: true,
        nationality: true,
        dateOfBirth: true,
        gender: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If no specific snarkel, just return user verification status
    if (!snarkelId) {
      return NextResponse.json({
        success: true,
        user: {
          ...user,
          canJoinQuizzes: user.isVerified,
        }
      });
    }

    // Get snarkel verification requirements
    const snarkel = await prisma.snarkel.findUnique({
      where: { id: snarkelId },
      select: {
        id: true,
        requireVerification: true,
        minAge: true,
        allowedCountries: true,
        excludedCountries: true,
        spamControlEnabled: true,
        entryFeeAmount: true,
        entryFeeTokenAddress: true,
      }
    });

    if (!snarkel) {
      return NextResponse.json(
        { error: 'Snarkel not found' },
        { status: 404 }
      );
    }

    // Check if user meets verification requirements
    let canJoin = true;
    let requirements = [];
    let missingRequirements = [];

    if (snarkel.requireVerification && !user.isVerified) {
      canJoin = false;
      missingRequirements.push('Identity verification required');
      requirements.push({
        type: 'verification',
        required: true,
        met: false,
        message: 'You must verify your identity to join this quiz'
      });
    } else if (snarkel.requireVerification && user.isVerified) {
      requirements.push({
        type: 'verification',
        required: true,
        met: true,
        message: 'Identity verification completed'
      });
    }

    // Check age requirement
    if (snarkel.minAge && user.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < snarkel.minAge) {
        canJoin = false;
        missingRequirements.push(`Minimum age ${snarkel.minAge} required`);
        requirements.push({
          type: 'age',
          required: true,
          met: false,
          message: `Minimum age ${snarkel.minAge} required, you are ${age}`
        });
      } else {
        requirements.push({
          type: 'age',
          required: true,
          met: true,
          message: `Age requirement met (${age} years old)`
        });
      }
    } else if (snarkel.minAge && !user.dateOfBirth) {
      canJoin = false;
      missingRequirements.push('Age verification required');
      requirements.push({
        type: 'age',
        required: true,
        met: false,
        message: 'Age verification required to join this quiz'
      });
    }

    // Check country restrictions
    if (snarkel.excludedCountries && snarkel.excludedCountries.length > 0) {
      if (user.country && snarkel.excludedCountries.includes(user.country)) {
        canJoin = false;
        missingRequirements.push('Country not allowed');
        requirements.push({
          type: 'country',
          required: true,
          met: false,
          message: `Users from ${user.country} cannot join this quiz`
        });
      } else if (user.country) {
        requirements.push({
          type: 'country',
          required: true,
          met: true,
          message: `Country ${user.country} is allowed`
        });
      } else {
        requirements.push({
          type: 'country',
          required: true,
          met: false,
          message: 'Country verification required'
        });
      }
    }

    // Check allowed countries
    if (snarkel.allowedCountries && snarkel.allowedCountries.length > 0) {
      if (user.country && snarkel.allowedCountries.includes(user.country)) {
        requirements.push({
          type: 'country',
          required: true,
          met: true,
          message: `Country ${user.country} is in allowed list`
        });
      } else if (user.country) {
        canJoin = false;
        missingRequirements.push('Country not in allowed list');
        requirements.push({
          type: 'country',
          required: true,
          met: false,
          message: `Country ${user.country} is not in the allowed list`
        });
      } else {
        requirements.push({
          type: 'country',
          required: true,
          met: false,
          message: 'Country verification required'
        });
      }
    }

    // Check entry fee requirements
    if (snarkel.spamControlEnabled && snarkel.entryFeeAmount && parseFloat(snarkel.entryFeeAmount) > 0) {
      requirements.push({
        type: 'entryFee',
        required: true,
        met: true,
        message: `Entry fee: ${snarkel.entryFeeAmount} ${snarkel.entryFeeTokenAddress ? 'tokens' : 'ETH'}`
      });
    }

    return NextResponse.json({
      success: true,
      canJoin,
      user: {
        ...user,
        canJoinQuizzes: user.isVerified,
      },
      snarkel: {
        id: snarkel.id,
        requireVerification: snarkel.requireVerification,
        minAge: snarkel.minAge,
        allowedCountries: snarkel.allowedCountries,
        excludedCountries: snarkel.excludedCountries,
        spamControlEnabled: snarkel.spamControlEnabled,
        entryFeeAmount: snarkel.entryFeeAmount,
        entryFeeTokenAddress: snarkel.entryFeeTokenAddress,
      },
      requirements,
      missingRequirements,
    });

  } catch (error: any) {
    console.error('Verification status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
