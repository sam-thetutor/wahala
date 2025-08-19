'use client';

import React, { useState, useEffect } from 'react';
import { SelfQRcodeWrapper, SelfAppBuilder, type SelfApp } from '@selfxyz/qrcode';
import { getUniversalLink } from '@selfxyz/core';
import { ethers } from 'ethers';

interface SelfVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
  snarkelId?: string;
}

export default function SelfVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  snarkelId
}: SelfVerificationModalProps) {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");

  useEffect(() => {
    if (isOpen) {
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
            // Only what we need - country and nationality
            nationality: true,
            issuing_state: true, // This gives us the country
          }
        }).build();

        setSelfApp(app);
        setUniversalLink(getUniversalLink(app));
      } catch (error) {
        console.error('Failed to initialize Self app:', error);
      }
    }
  }, [isOpen, userId, snarkelId]);

  const handleVerificationSuccess = () => {
    console.log('Verification successful!');
    onSuccess();
    onClose();
  };

  const handleVerificationError = (error: any) => {
    console.error('Verification failed:', error);
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
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Verify Your Identity</h2>
          <p className="text-gray-600 mb-6">
            Scan this QR code with the Self app to verify your identity
          </p>
          
          {selfApp ? (
            <div className="space-y-4">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleVerificationSuccess}
                onError={handleVerificationError}
              />
              
              <button
                onClick={openSelfApp}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Open Self App
              </button>
            </div>
          ) : (
            <div className="text-gray-500">Loading QR Code...</div>
          )}
          
          <button
            onClick={onClose}
            className="mt-4 text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
