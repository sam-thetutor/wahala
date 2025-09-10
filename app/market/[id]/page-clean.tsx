'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';
import { Share2, CheckCircle, ChevronDown, ChevronUp, RefreshCw, TrendingUp, Users, Clock } from 'lucide-react';

// Custom Hooks
import { useSubgraphMarketDetails } from '@/hooks/useSubgraphMarketDetails';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';
import { useFarcaster } from '@/components/FarcasterProvider';
import OptimisticBuyButton from '@/components/OptimisticBuyButton';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Typography, Heading1, Heading2, Heading3, Body, BodySmall, Caption } from '@/components/ui/Typography';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatTimeRemaining, formatCurrency, formatPercentage } from '@/lib/utils';

interface MarketDetailProps {
  params: Promise<{ id: string }>;
}

const MarketDetail: React.FC<MarketDetailProps> = ({ params }) => {
  const { id } = useParams();
  const marketId = id as string;

  // Farcaster integration
  const { 
    isFarcasterApp, 
    isReady, 
    context, 
    showToast, 
    composeCast, 
    getUserDisplayName, 
    getUserEmoji,
    isInFarcasterContext 
  } = useFarcaster();

  // Wallet integration
  const { address, isConnected } = useAccount();
  
  // Get Farcaster wallet address if available
  const farcasterAddress = isInFarcasterContext() && context?.user?.walletAddress 
    ? context.user.walletAddress 
    : address;
  
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: farcasterAddress,
    chainId: 42220
  });

  const { notifyTransactionSuccess } = useNotificationHelpers();
  
  // State for refresh trigger from buy button
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Local state
  const [orderBookExpanded, setOrderBookExpanded] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  
  // Trading state
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no'>('yes');
  const [buyAmount, setBuyAmount] = useState('1');

  // Market data from subgraph
  const {
    market: smartMarketData,
    participants,
    loading: dataLoading,
    participantsLoading,
    error: dataError,
    lastUpdated,
    refresh: refreshData,
    isRefreshing,
    hasUpdates,
    initialLoadComplete
  } = useSubgraphMarketDetails({
    marketId: marketId || '',
    enabled: true
  });

  // Handle refresh trigger from share purchase
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 Refresh triggered by share purchase, refreshing data...');
      refreshData();
    }
  }, [refreshTrigger, refreshData]);

  // Calculate market statistics
  const marketStats = useMemo(() => {
    if (!smartMarketData) return null;
    
    let totalYesShares = 0;
    let totalNoShares = 0;
    
    // Calculate from participants data if available (more accurate)
    if (participants && participants.length > 0) {
      totalYesShares = participants.reduce((sum, participant) => {
        return sum + parseFloat(participant.totalYesShares || '0');
      }, 0);
      totalNoShares = participants.reduce((sum, participant) => {
        return sum + parseFloat(participant.totalNoShares || '0');
      }, 0);
    } else {
      // Fallback to market data
      totalYesShares = parseFloat(smartMarketData.totalYes || '0');
      totalNoShares = parseFloat(smartMarketData.totalNo || '0');
    }
    
    const totalShares = totalYesShares + totalNoShares;
    const yesPercentage = totalShares > 0 ? (totalYesShares / totalShares) * 100 : 50;
    const totalVolume = parseFloat(smartMarketData.totalPool || '0');
    
    return {
      totalYesShares,
      totalNoShares,
      totalShares,
      yesPercentage,
      totalVolume,
      participantCount: participants?.length || 0
    };
  }, [smartMarketData, participants]);

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (!smartMarketData) return 0;
    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = Math.floor(new Date(smartMarketData.endTime).getTime() / 1000);
    return endTime - currentTime;
  }, [smartMarketData]);

  const isEnded = timeRemaining <= 0;

  // Get status badge variant
  const getStatusVariant = () => {
    if (isEnded) return 'market-ended';
    if (timeRemaining < 3600) return 'warning';
    if (timeRemaining < 86400) return 'pending';
    return 'market-active';
  };

  // Loading state
  if (dataLoading && !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="xl" label="Loading market details..." />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (dataError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <div className="text-error text-6xl mb-4">⚠️</div>
              <Heading2 className="mb-4">Error Loading Market</Heading2>
              <Body className="text-gray-600 mb-6">
                {dataError || 'An error occurred while loading market details'}
              </Body>
              <Button onClick={() => refreshData()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No market found
  if (!smartMarketData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <Heading2 className="mb-4">Market Not Found</Heading2>
              <Body className="text-gray-600">
                The market you're looking for doesn't exist or has been removed.
              </Body>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant={getStatusVariant()}>
                  {isEnded ? 'Ended' : formatTimeRemaining(timeRemaining)}
                </Badge>
                {isRefreshing && (
                  <Badge variant="pending">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Syncing...
                  </Badge>
                )}
              </div>
              
              <Heading1 className="mb-2">
                {smartMarketData.question}
              </Heading1>
              
              <Body className="text-gray-600 mb-4">
                {smartMarketData.description}
              </Body>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{marketStats?.participantCount || 0} participants</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Ends {new Date(smartMarketData.endTime).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Share functionality
                if (navigator.share) {
                  navigator.share({
                    title: smartMarketData.question,
                    text: smartMarketData.description,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  showToast?.('Link copied to clipboard!');
                }
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Odds */}
            <Card>
              <CardHeader>
                <CardTitle>Current Odds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                      <Body className="font-semibold">YES</Body>
                    </div>
                    <Heading3 className="text-success-600">
                      {formatPercentage(marketStats?.yesPercentage || 50)}
                    </Heading3>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-success-500 to-success-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${marketStats?.yesPercentage || 50}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-error-500 rounded-full"></div>
                      <Body className="font-semibold">NO</Body>
                    </div>
                    <Heading3 className="text-error-600">
                      {formatPercentage(100 - (marketStats?.yesPercentage || 50))}
                    </Heading3>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Information */}
            <Card>
              <CardHeader>
                <CardTitle>Market Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Caption className="text-gray-500">Total Volume</Caption>
                    <Body className="font-semibold">
                      {formatCurrency(marketStats?.totalVolume || 0)}
                    </Body>
                  </div>
                  <div>
                    <Caption className="text-gray-500">Participants</Caption>
                    <Body className="font-semibold">
                      {marketStats?.participantCount || 0}
                    </Body>
                  </div>
                  <div>
                    <Caption className="text-gray-500">Created</Caption>
                    <Body className="font-semibold">
                      {new Date(smartMarketData.createdAt).toLocaleDateString()}
                    </Body>
                  </div>
                  <div>
                    <Caption className="text-gray-500">Status</Caption>
                    <Body className="font-semibold">
                      {smartMarketData.status}
                    </Body>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected ? (
                  <div className="text-center py-8">
                    <Body className="text-gray-500 mb-4">
                      Connect your wallet to start trading
                    </Body>
                    <Button className="w-full">
                      Connect Wallet
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Side Selection */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedSide === 'yes' ? 'primary' : 'outline'}
                        onClick={() => setSelectedSide('yes')}
                        className="w-full"
                      >
                        YES
                      </Button>
                      <Button
                        variant={selectedSide === 'no' ? 'primary' : 'outline'}
                        onClick={() => setSelectedSide('no')}
                        className="w-full"
                      >
                        NO
                      </Button>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (CELO)
                      </label>
                      <input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="input w-full"
                        placeholder="1.0"
                        min="0.1"
                        step="0.1"
                      />
                    </div>

                    {/* Buy Button */}
                    <OptimisticBuyButton
                      marketId={marketId}
                      amount={buyAmount}
                      side={selectedSide}
                      className="w-full"
                      onRefreshTrigger={setRefreshTrigger}
                    />

                    {/* Balance Display */}
                    {balance && (
                      <div className="text-center">
                        <Caption className="text-gray-500">
                          Balance: {formatCurrency(Number(balance.formatted))}
                        </Caption>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetail;
