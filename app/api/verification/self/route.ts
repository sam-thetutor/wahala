import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  SelfBackendVerifier,
  AllIds,
  DefaultConfigStore,
} from '@selfxyz/core';

const prisma = new PrismaClient();

// Define your verification requirements
const verification_config = {
  excludedCountries: [],
  ofac: false,
  minimumAge: 18,
};

// Create the configuration store
const configStore = new DefaultConfigStore(verification_config);

// Initialize the verifier
const selfBackendVerifier = new SelfBackendVerifier(
  process.env.NEXT_PUBLIC_SELF_SCOPE || 'snarkels-verification',  // Your app's unique scope
  process.env.NEXT_PUBLIC_SELF_ENDPOINT || 'https://snarkels.lol/api/verification/self',  // Your API endpoint
  process.env.NODE_ENV === 'development',                         // true = mock for testing, false = production
  AllIds,                                                         // Accept all document types
  configStore,                                                    // Configuration store
  'hex'                                                           // "hex" for addresses, "uuid" for UUIDs
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      attestationId, 
      proof, 
      publicSignals, 
      userContextData,
      snarkelId,
      userId,
      walletAddress 
    } = body;

    // Verify all required fields are present
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json({
        success: false,
        error: 'Proof, publicSignals, attestationId and userContextData are required for Self verification',
      }, { status: 400 });
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
        
        // Find or create user
        let user = await prisma.user.findUnique({
          where: { address: walletAddress?.toLowerCase() }
        });

        if (!user && walletAddress) {
          user = await prisma.user.create({
            data: {
              address: walletAddress.toLowerCase(),
              name: `User ${walletAddress.slice(0, 8)}...`,
              totalPoints: 0
            }
          });
        }

        if (user) {
          // Update user verification status
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
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
              userId: user.id,
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
            message: 'Self Protocol verification successful',
            user: {
              id: updatedUser.id,
              isVerified: updatedUser.isVerified,
              country: updatedUser.country,
              nationality: updatedUser.nationality,
              dateOfBirth: updatedUser.dateOfBirth,
              gender: updatedUser.gender,
            },
            disclosedData
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'User not found and wallet address not provided',
          }, { status: 400 });
        }
      } else {
        // Verification failed
        return NextResponse.json({
          success: false,
          error: 'Self Protocol verification failed',
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
  } catch (error: any) {
    console.error('Self verification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
