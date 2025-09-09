'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useAccount } from 'wagmi';

const ReferralBanner: React.FC = () => {
  const { address } = useAccount();
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    // Check if user has seen the banner before
    const hasSeenBanner = localStorage.getItem('referral-banner-seen');
    if (!hasSeenBanner && address) {
      setIsVisible(true);
      // Generate referral code from address
      setReferralCode(address.slice(0, 8).toUpperCase());
    }
  }, [address]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('referral-banner-seen', 'true');
  };

  const handleCopyReferral = async () => {
    const referralUrl = `${window.location.origin}?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy referral URL:', error);
    }
  };

  if (!isVisible || !address) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                Invite friends and earn rewards! Share your referral link:
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <code className="text-xs bg-white/20 px-2 py-1 rounded">
                  {window.location.origin}?ref={referralCode}
                </code>
                <button
                  onClick={handleCopyReferral}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Copy referral link"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralBanner;
