'use client';

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from '@selfxyz/core';
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from '@selfxyz/qrcode';
import { ethers } from 'ethers';

interface SelfVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (verificationData: any) => void;
  onError: (error: string) => void;
  snarkelId?: string;
  userId?: string;
}

export default function SelfVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  snarkelId,
  userId,
}: SelfVerificationModalProps) {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && !selfApp) {
      try {
        const app = new SelfAppBuilder({
          version: 2,
          appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || 'Snarkels',
          scope: process.env.NEXT_PUBLIC_SELF_SCOPE || 'snarkels-verification',
          endpoint: process.env.NEXT_PUBLIC_SELF_ENDPOINT || 'https://snarkels.lol/api/verification/self',
          logoBase64: 'https://snarkels.lol/logo.png',
          userId: userId || ethers.ZeroAddress,
          endpointType: 'staging_https',
          userIdType: 'hex',
          userDefinedData: `Snarkels Verification - ${snarkelId || 'General'}`,
          disclosures: {
            // Verification requirements (must match backend)
            minimumAge: 18,
            ofac: false,
            excludedCountries: [],

            // Disclosure requests (what users reveal)
            nationality: true,
            gender: true,
            date_of_birth: true,
            issuing_state: true,
          }
        }).build();

        setSelfApp(app);
        setUniversalLink(getUniversalLink(app));
      } catch (error) {
        console.error('Failed to initialize Self app:', error);
        setErrorMessage('Failed to initialize verification system');
        setVerificationStatus('error');
      }
    }
  }, [isOpen, snarkelId, userId]);

  const handleVerificationSuccess = () => {
    console.log('Verification successful!');
    setVerificationStatus('success');
    
    // The SelfQRcodeWrapper automatically handles the verification
    // We just need to update our local state and call the success callback
    onSuccess({ message: 'Verification successful' });
    
    // Close modal after success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleVerificationError = (error: any) => {
    console.error('Self verification error:', error);
    const errorMessage = error?.reason || error?.error_code || 'Verification failed. Please try again.';
    setErrorMessage(errorMessage);
    setVerificationStatus('error');
    onError(errorMessage);
  };

  const openSelfApp = () => {
    if (universalLink) {
      window.open(universalLink, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Verify Your Identity</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {verificationStatus === 'idle' && selfApp && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              To join this quiz, you need to verify your identity using Self Protocol.
            </p>
            
            {/* QR Code for desktop/cross-device */}
            <div className="hidden md:block mb-4">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleVerificationSuccess}
                onError={handleVerificationError}
              />
            </div>
            
            {/* Universal Link button for mobile */}
            <div className="md:hidden mb-4">
              <button
                onClick={openSelfApp}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Self App
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Scan the QR code with the Self app or tap the button on mobile
            </p>
          </div>
        )}

        {verificationStatus === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your identity...</p>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <p className="text-green-600 font-semibold mb-2">Verification Successful!</p>
            <p className="text-gray-600">You can now join the quiz.</p>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <p className="text-red-600 font-semibold mb-2">Verification Failed</p>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <button
              onClick={() => {
                setVerificationStatus('idle');
                setErrorMessage('');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
