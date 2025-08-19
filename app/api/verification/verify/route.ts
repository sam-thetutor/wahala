import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  SelfBackendVerifier,
  AllIds,
  DefaultConfigStore,
} from '@selfxyz/core';

const prisma = new PrismaClient();

// Define verification requirements (must match frontend)
const verification_config = {
  excludedCountries: [],
  ofac: false,
  minimumAge: 18,
};

// Create the configuration store
const configStore = new DefaultConfigStore(verification_config);

// Initialize the verifier
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.NEXT_PUBLIC_SELF_SCOPE || 'snarkels-verification',
  process.env.NEXT_PUBLIC_SELF_ENDPOINT || '',
  process.env.NODE_ENV === 'development', // true = mock for testing, false = production
  AllIds,
  configStore,
  'hex'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { snarkelId, userId, verificationType, proof, publicSignals, attestationId, userContextData } = body;

    if (!verificationType) {
      return NextResponse.json(
        { error: 'Verification type is required' },
        { status: 400 }
      );
    }

    if (verificationType === 'self') {
      // For Self Protocol verification, we need the proof data
      if (!proof || !publicSignals || !attestationId || !userContextData) {
        return NextResponse.json(
          { error: 'Proof, publicSignals, attestationId and userContextData are required for Self verification' },
          { status: 400 }
        );
      }

      try {
        // Verify the proof using Self Protocol
        const result = await selfBackendVerifier.verify(
          attestationId,    // Document type (1 = passport, 2 = EU ID card)
          proof,            // The zero-knowledge proof
          publicSignals,    // Public signals array
          userContextData   // User context data
        );

        if (result.isValidDetails.isValid) {
          // Verification successful - extract user data
          const disclosedData = result.discloseOutput;
          
          // Update user verification status
          const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              isVerified: true,
              verificationMethod: 'self',
              verifiedAt: new Date(),
              country: disclosedData.issuingState || null,
              nationality: disclosedData.nationality || null,
              dateOfBirth: disclosedData.dateOfBirth ? new Date(disclosedData.dateOfBirth) : null,
              gender: disclosedData.gender || null,
            }
          });

          // Create verification attempt record
          await prisma.verificationAttempt.create({
            data: {
              userId,
              snarkelId,
              verificationType: 'self',
              status: 'success',
              proofData: {
                attestationId,
                disclosedData,
                verifiedAt: new Date().toISOString()
              },
              verifiedAt: new Date(),
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
            }
          });

          return NextResponse.json({
            success: true,
            message: 'Verification successful',
            user: {
              id: updatedUser.id,
              isVerified: updatedUser.isVerified,
              country: updatedUser.country,
              nationality: updatedUser.nationality,
              dateOfBirth: updatedUser.dateOfBirth,
              gender: updatedUser.gender,
            }
          });
        } else {
          // Verification failed
          return NextResponse.json({
            success: false,
            error: 'Verification failed',
            details: result.isValidDetails,
          }, { status: 400 });
        }
      } catch (verificationError: any) {
        console.error('Self verification error:', verificationError);
        return NextResponse.json({
          success: false,
          error: 'Verification processing failed',
          details: verificationError.message,
        }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported verification type' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
