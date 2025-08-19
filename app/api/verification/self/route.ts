import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from '@selfxyz/core';

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
  process.env.NEXT_PUBLIC_SELF_ENDPOINT || 'https://snarkels.lol/api/verification/self',
  false,
  AllIds,
  configStore,
  'hex'
);

export async function POST(request: NextRequest) {
  try {
    const { attestationId, proof, publicSignals, userContextData } = await request.json();

    // Verify all required fields are present
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json({
        message: "Proof, publicSignals, attestationId and userContextData are required",
      }, { status: 400 });
    }

    // Verify the proof
    const result = await selfBackendVerifier.verify(
      attestationId,    // Document type (1 = passport, 2 = EU ID card)
      proof,            // The zero-knowledge proof
      publicSignals,    // Public signals array
      userContextData   // User context data
    );

    // Check if verification was successful
    if (result.isValidDetails.isValid) {
      // Verification successful - process the result
      const disclosedData = result.discloseOutput;
      
      return NextResponse.json({
        status: "success",
        result: true,
        credentialSubject: disclosedData,
      });
    } else {
      // Verification failed
      return NextResponse.json({
        status: "error",
        result: false,
        message: "Verification failed",
        details: result.isValidDetails,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({
      status: "error",
      result: false,
      message: "Internal server error",
    }, { status: 500 });
  }
}
