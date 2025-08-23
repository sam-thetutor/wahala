'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import SelfVerificationModal from '../../components/verification/SelfVerificationModal';
import WalletConnectButton from '../../components/WalletConnectButton';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const [snarkelCode, setSnarkelCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentSnarkelId, setCurrentSnarkelId] = useState<string | null>(null);
  const [isAlreadyParticipant, setIsAlreadyParticipant] = useState(false);

  // Check for snarkelCode in URL parameters on component mount
  useEffect(() => {
    const urlSnarkelCode = searchParams.get('snarkelCode');
    if (urlSnarkelCode) {
      setSnarkelCode(urlSnarkelCode);
      // Auto-fill the input and show a message
      console.log('Auto-filled snarkel code from URL:', urlSnarkelCode);
    }
  }, [searchParams]);

  const handleJoinSnarkel = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!snarkelCode.trim()) {
      setError('Please enter a snarkel code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/snarkel/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          snarkelCode: snarkelCode.trim(),
          userAddress: address
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.verificationRequired) {
          // Show verification modal
          setVerificationRequired(true);
          setCurrentSnarkelId(data.snarkelId);
          setShowVerificationModal(true);
        } else if (data.alreadyParticipant) {
          // User is already a participant, redirect to room
          setIsAlreadyParticipant(true);
          router.push(`/quiz/${data.snarkelId}/room/${data.roomId}`);
        } else {
          // Join successful, redirect to room
          router.push(`/quiz/${data.snarkelId}/room/${data.roomId}`);
        }
      } else {
        setError(data.error || 'Failed to join snarkel');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = async () => {
    // After successful verification, try joining again
    if (currentSnarkelId) {
      try {
        const response = await fetch('/api/snarkel/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            snarkelCode: snarkelCode.trim(),
            skipVerification: true,
            userAddress: address
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.alreadyParticipant) {
            // User is already a participant, redirect to room
            router.push(`/quiz/${data.snarkelId}/room/${data.roomId}`);
          } else {
            // Join successful, redirect to room
            router.push(`/quiz/${data.snarkelId}/room/${data.roomId}`);
          }
        } else {
          setError(data.error || 'Failed to join after verification');
        }
      } catch (err) {
        setError('Network error after verification. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Join Snarkel</h1>
          <p className="text-gray-600">Enter the code to join a quiz</p>
        </div>

        {!isConnected ? (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Please connect your wallet to join a quiz</p>
              <WalletConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label htmlFor="snarkelCode" className="block text-sm font-medium text-gray-700 mb-2">
                Snarkel Code
              </label>
              <input
                type="text"
                id="snarkelCode"
                value={snarkelCode}
                onChange={(e) => setSnarkelCode(e.target.value)}
                placeholder="Enter snarkel code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {searchParams.get('snarkelCode') && (
                <div className="mt-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  ✨ Auto-filled from featured quiz
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {isAlreadyParticipant && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                You are already a participant in this quiz. Click to enter the room.
              </div>
            )}

            <button
              onClick={handleJoinSnarkel}
              disabled={isLoading || !snarkelCode.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Joining...' : isAlreadyParticipant ? 'Enter Room' : 'Join Snarkel'}
            </button>
          </div>
        )}

        {verificationRequired && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              This quiz requires identity verification. Please verify your identity to continue.
            </p>
          </div>
        )}
      </div>

      <SelfVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={handleVerificationSuccess}
        snarkelId={currentSnarkelId || undefined}
      />
    </div>
  );
}