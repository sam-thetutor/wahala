'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';

interface ReferralContextType {
  referralCode: string | null;
  submitReferral: (data: { type: string; marketId: string }, txHash: string) => Promise<void>;
  getReferralCode: () => string | null;
  setReferralCode: (code: string | null) => void;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

interface ReferralProviderProps {
  children: ReactNode;
}

export function ReferralProvider({ children }: ReferralProviderProps) {
  const { address } = useAccount();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Generate referral code from address
  useEffect(() => {
    if (address) {
      const code = address.slice(0, 8).toUpperCase();
      setReferralCode(code);
    } else {
      setReferralCode(null);
    }
  }, [address]);

  const getReferralCode = () => {
    return referralCode;
  };

  const submitReferral = async (data: { type: string; marketId: string }, txHash: string) => {
    if (!referralCode) return;

    try {
      // Here you would typically submit to your referral tracking system
      // For now, we'll just log it
      console.log('Referral submitted:', {
        referralCode,
        type: data.type,
        marketId: data.marketId,
        txHash,
        timestamp: new Date().toISOString()
      });

      // You could integrate with Divvi or another referral system here
      // await submitDivviReferral(txHash as `0x${string}`, 42220);
    } catch (error) {
      console.error('Failed to submit referral:', error);
    }
  };

  const value: ReferralContextType = {
    referralCode,
    submitReferral,
    getReferralCode,
    setReferralCode
  };

  return (
    <ReferralContext.Provider value={value}>
      {children}
    </ReferralContext.Provider>
  );
}

export function useReferral() {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error('useReferral must be used within a ReferralProvider');
  }
  return context;
}
