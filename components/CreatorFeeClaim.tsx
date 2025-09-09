'use client'

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { usePredictionMarket } from '@/hooks/usePredictionMarket';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';

interface CreatorFeeClaimProps {
  marketId: bigint;
  marketQuestion: string;
  className?: string;
}

const CreatorFeeClaim: React.FC<CreatorFeeClaimProps> = ({
  marketId,
  marketQuestion,
  className = ''
}) => {
  const { isConnected, address } = useAccount();
  const { claimCreatorFee, contractState } = usePredictionMarket();
  const { notifyTransactionSuccess, notifyTransactionFailed } = useNotificationHelpers();
  
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimFee = async () => {
    if (!isConnected || !address) {
      notifyTransactionFailed('Please connect your wallet to claim creator fees.');
      return;
    }

    try {
      setIsClaiming(true);
      
      await claimCreatorFee(Number(marketId));
      
      notifyTransactionSuccess('Creator fee claimed successfully!');
    } catch (error) {
      console.error('Error claiming creator fee:', error);
      notifyTransactionFailed('Failed to claim creator fee. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm md:text-base font-medium text-blue-900 mb-1">
            Creator Fee Available
          </h4>
          <p className="text-xs md:text-sm text-blue-700 mb-2">
            You can claim 15% of the total pool as creator fee for this resolved market.
          </p>
          <p className="text-xs text-blue-600">
            Market: {marketQuestion.length > 50 ? `${marketQuestion.substring(0, 50)}...` : marketQuestion}
          </p>
        </div>
        <button
          onClick={handleClaimFee}
          disabled={isClaiming || contractState.isLoading}
          className="ml-4 px-3 md:px-4 py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isClaiming || contractState.isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2"></div>
              Claiming...
            </div>
          ) : (
            'Claim Fee'
          )}
        </button>
      </div>
    </div>
  );
};

export { CreatorFeeClaim };
