'use client';

import React, { useState } from 'react';
import { useClaims } from '@/hooks/useClaims';
import { usePredictionMarket } from '@/hooks/usePredictionMarket';
import { useNotifications } from '@/components/NotificationContainer';
import { formatEther } from 'viem';
import { 
  Trophy, 
  Coins, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface ClaimsSectionProps {
  userAddress: string;
}

const ClaimsSection: React.FC<ClaimsSectionProps> = ({ userAddress }) => {
  const { 
    winnings, 
    creatorFees, 
    totalClaimableWinnings, 
    totalClaimableCreatorFees, 
    totalClaimed,
    loading, 
    error, 
    refetch 
  } = useClaims(userAddress);
  
  const { claimWinnings, claimCreatorFee, contractState } = usePredictionMarket();
  const { addNotification } = useNotifications();
  
  const [claimingWinnings, setClaimingWinnings] = useState<string | null>(null);
  const [claimingCreatorFee, setClaimingCreatorFee] = useState<string | null>(null);

  const handleClaimWinnings = async (marketId: string, marketQuestion: string) => {
    try {
      setClaimingWinnings(marketId);
      
      const result = await claimWinnings(parseInt(marketId));
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Winnings Claimed!',
          message: `Successfully claimed winnings for "${marketQuestion}"`,
          duration: 5000
        });
        
        // Refresh claims data
        setTimeout(() => {
          refetch();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to claim winnings');
      }
    } catch (err) {
      console.error('Error claiming winnings:', err);
      addNotification({
        type: 'error',
        title: 'Claim Failed',
        message: 'Failed to claim winnings. Please try again.',
        duration: 7000
      });
    } finally {
      setClaimingWinnings(null);
    }
  };

  const handleClaimCreatorFee = async (marketId: string, marketQuestion: string) => {
    try {
      setClaimingCreatorFee(marketId);
      
      const result = await claimCreatorFee(parseInt(marketId));
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Creator Fee Claimed!',
          message: `Successfully claimed creator fee for "${marketQuestion}"`,
          duration: 5000
        });
        
        // Refresh claims data
        setTimeout(() => {
          refetch();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to claim creator fee');
      }
    } catch (err) {
      console.error('Error claiming creator fee:', err);
      addNotification({
        type: 'error',
        title: 'Claim Failed',
        message: 'Failed to claim creator fee. Please try again.',
        duration: 7000
      });
    } finally {
      setClaimingCreatorFee(null);
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num === 0) return '0.0000';
    if (num < 0.0001) return '< 0.0001';
    if (num >= 1000) return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
    return num.toFixed(4);
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Claims...</h3>
          <p className="text-gray-600">Fetching your claimable rewards</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Claims</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Claimable Winnings</h3>
              <p className="text-2xl font-bold text-green-900">{formatAmount(totalClaimableWinnings)} CELO</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Coins className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Creator Fees</h3>
              <p className="text-2xl font-bold text-blue-900">{formatAmount(totalClaimableCreatorFees)} CELO</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="text-sm font-medium text-purple-800">Total Claimed</h3>
              <p className="text-2xl font-bold text-purple-900">{formatAmount(totalClaimed)} CELO</p>
            </div>
          </div>
        </div>
      </div>

      {/* Winnings Section */}
      {winnings.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-green-600" />
              Winnings to Claim ({winnings.length})
            </h2>
          </div>
          
          <div className="space-y-4">
            {winnings.map((claim) => (
              <div key={claim.marketId} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                claim.isClaimed ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">{claim.marketQuestion}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Winning Side:</span> {claim.winningSide ? 'YES' : 'NO'}
                      </div>
                      <div>
                        <span className="font-medium">Your Shares:</span> {formatAmount(claim.userShares)} CELO
                      </div>
                      <div>
                        <span className="font-medium">Resolved:</span> {formatDate(claim.resolvedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{formatAmount(claim.claimableAmount)} CELO</div>
                      <div className="text-sm text-gray-500">Claimable Amount</div>
                    </div>
                    <button
                      onClick={() => handleClaimWinnings(claim.marketId, claim.marketQuestion)}
                      disabled={contractState.isLoading || claimingWinnings === claim.marketId || claim.isClaimed}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        claim.isClaimed
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : contractState.isLoading || claimingWinnings === claim.marketId
                          ? 'bg-green-400 text-white cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {claim.isClaimed ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Claimed
                        </>
                      ) : claimingWinnings === claim.marketId ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Trophy className="w-4 h-4" />
                          Claim Winnings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creator Fees Section */}
      {creatorFees.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              Creator Fees to Claim ({creatorFees.length})
            </h2>
          </div>
          
          <div className="space-y-4">
            {creatorFees.map((claim) => (
              <div key={claim.marketId} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                claim.isClaimed ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">{claim.marketQuestion}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Total Pool:</span> {formatAmount(claim.totalPool)} CELO
                      </div>
                      <div>
                        <span className="font-medium">Resolved:</span> {formatDate(claim.resolvedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{formatAmount(claim.creatorFee)} CELO</div>
                      <div className="text-sm text-gray-500">Creator Fee</div>
                    </div>
                    <button
                      onClick={() => handleClaimCreatorFee(claim.marketId, claim.marketQuestion)}
                      disabled={contractState.isLoading || claimingCreatorFee === claim.marketId || claim.isClaimed}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        claim.isClaimed
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : contractState.isLoading || claimingCreatorFee === claim.marketId
                          ? 'bg-blue-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {claim.isClaimed ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Claimed
                        </>
                      ) : claimingCreatorFee === claim.marketId ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4" />
                          Claim Fee
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {winnings.length === 0 && creatorFees.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Claims Available</h3>
          <p className="text-gray-600 mb-4">
            You don't have any claimable winnings or creator fees at the moment.
          </p>
          <p className="text-sm text-gray-500">
            Claims will appear here when markets you participated in are resolved in your favor, 
            or when markets you created are resolved.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClaimsSection;
