'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { Share2, CheckCircle, ChevronDown, ChevronUp, RefreshCw, TrendingUp, Users, Clock } from 'lucide-react';

// Custom Hooks
import { useSubgraphMarketDetails } from '@/hooks/useSubgraphMarketDetails';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';
import { useFarcaster } from '@/components/FarcasterProvider';

import OptimisticBuyButton from '@/components/OptimisticBuyButton';
import { formatTimeRemaining, formatCurrency, formatPercentage, formatVolume, formatDate, shortenAddress, calculatePotentialReturn } from '@/lib/utils';

// Design System Components
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';

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
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
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
  const [justPurchased, setJustPurchased] = useState(false);
  const [refreshingAfterPurchase, setRefreshingAfterPurchase] = useState(false);

  // Auto-switch to Celo Mainnet when component loads
  useEffect(() => {
    if (isConnected && chainId && chainId !== 42220) {
      console.log('🔄 Auto-switching to Celo Mainnet...', { currentChainId: chainId });
      try {
        switchChain({ chainId: 42220 });
      } catch (error) {
        console.error('❌ Failed to auto-switch to Celo Mainnet:', error);
      }
    }
  }, [isConnected, chainId, switchChain]);
  const [isBuying, setIsBuying] = useState(false);

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

  // Farcaster-specific effects
  useEffect(() => {
    if (isFarcasterApp && isReady) {
      console.log('🎯 Farcaster Mini App detected:', {
        user: getUserDisplayName(),
        context: context?.location?.type || 'unknown'
      });
    }
  }, [isFarcasterApp, isReady, context, getUserDisplayName]);

  console.log('🔄 Market data from subgraph:', smartMarketData);
  console.log('🔄 Participants data from subgraph:', participants);
  console.log('🔄 Data loading states:', { dataLoading, participantsLoading });
  console.log('🔄 Data errors:', { dataError });
  

  // Handle errors
  useEffect(() => {
    if (dataError) {
      console.error('❌ Market data error:', dataError);
    }
  }, [dataError]);

  // Handle refresh trigger from share purchase
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 Refresh triggered by share purchase, refreshing data...');
      refreshData();
    }
  }, [refreshTrigger, refreshData]);

  // Handle just purchased state (for UI feedback)
  useEffect(() => {
    if (justPurchased) {
      // Reset just purchased state after 30 seconds
      setTimeout(() => {
        setJustPurchased(false);
      }, 30000);
    }
  }, [justPurchased]);

  // Calculate market statistics
  const yesPercentage = useMemo(() => {
    if (!smartMarketData) return 50;
    
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
      totalYesShares = parseFloat(smartMarketData?.totalYes || '0');
      totalNoShares = parseFloat(smartMarketData?.totalNo || '0');
    }
    
    const total = totalYesShares + totalNoShares;
    return total > 0 ? (totalYesShares / total) * 100 : 50;
  }, [smartMarketData, participants]);

  const noPercentage = useMemo(() => {
    return 100 - yesPercentage;
  }, [yesPercentage]);

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (!smartMarketData?.endTime) return 0;
    const endTime = new Date(smartMarketData.endTime).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((endTime - now) / 1000));
  }, [smartMarketData?.endTime]);

  const isEnded = timeRemaining <= 0;

  const totalVolume = useMemo(() => {
    if (!smartMarketData) return 0;
    
    let total = 0;
    
    // Calculate total volume from participants data if available (more accurate)
    if (participants && participants.length > 0) {
      total = participants.reduce((sum, participant) => {
        return sum + parseFloat(participant.totalInvestment || '0');
      }, 0);
    } else {
      // Fallback to market data (subgraph data is already in CELO format)
      total = parseFloat(smartMarketData?.totalYes || '0') + parseFloat(smartMarketData?.totalNo || '0');
    }
    
    return total;
  }, [smartMarketData, participants]);

  // Format volume - data is already in CELO format from subgraph
  const formatVolume = (volume: number) => {
    // Data is already in CELO format, no conversion needed
    const celoAmount = volume;
    
    if (celoAmount >= 1e12) {
      return `${(celoAmount / 1e12).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}T CELO`;
    } else if (celoAmount >= 1e9) {
      return `${(celoAmount / 1e9).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}B CELO`;
    } else if (celoAmount >= 1e6) {
      return `${(celoAmount / 1e6).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}M CELO`;
    } else if (celoAmount >= 1e3) {
      return `${(celoAmount / 1e3).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}K CELO`;
    } else {
      return `${celoAmount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 6 
      })} CELO`;
    }
  };

  // Shorten address
  const shortenAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Use Farcaster address for display and transactions
  const displayAddress = farcasterAddress || address;

  // Format date properly
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No end date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format wallet balance
  const formatBalance = (balance: any) => {
    if (!balance || balanceLoading) return 'Loading...';
    if (!isConnected) return 'Not connected';
    
    const value = parseFloat(balance.formatted);
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  // Get full balance for calculations
  const getFullBalance = () => {
    if (!balance || !isConnected) return 0;
    return parseFloat(balance.formatted);
  };

  // Calculate share prices
  const yesPrice = useMemo(() => {
    if (!smartMarketData || !smartMarketData.totalYes || !smartMarketData.totalNo) return 0.5;
    const total = parseFloat(smartMarketData.totalYes) + parseFloat(smartMarketData.totalNo);
    return total > 0 ? parseFloat(smartMarketData.totalYes) / total : 0.5;
  }, [smartMarketData]);

  const noPrice = useMemo(() => {
    return 1 - yesPrice;
  }, [yesPrice]);

  // Calculate trading details using smart contract logic
  const tradingDetails = useMemo(() => {
    if (!smartMarketData || !buyAmount || isNaN(parseFloat(buyAmount))) {
      return {
        shares: 0,
        avgPrice: 0,
        fees: 0,
        potentialReturn: 0,
        returnPercentage: 0,
        breakdown: {
          originalStake: 0,
          winningsFromLosers: 0,
          creatorFee: 0,
          platformFee: 0,
          totalWinnings: 0,
        }
      };
    }

    const amount = parseFloat(buyAmount);
    const currentPrice = selectedSide === 'yes' ? yesPrice : noPrice;
    const shares = amount / currentPrice;
    const fees = amount * 0.0021; // 0.21% transaction fee (separate from market fees)

    // Get current market data
    const totalYes = parseFloat(smartMarketData?.totalYes || '0');
    const totalNo = parseFloat(smartMarketData?.totalNo || '0');
    
    // Determine winning and losing shares based on selected side
    const totalWinningShares = selectedSide === 'yes' ? totalYes : totalNo;
    const totalLosingShares = selectedSide === 'yes' ? totalNo : totalYes;
    
    // Calculate potential return using smart contract logic
    const returnCalculation = calculatePotentialReturn(
      shares,
      totalWinningShares,
      totalLosingShares,
      15 // Creator fee percentage (from contract)
    );

    return {
      shares: shares,
      avgPrice: currentPrice,
      fees: fees,
      potentialReturn: returnCalculation.potentialReturn,
      returnPercentage: returnCalculation.returnPercentage,
      breakdown: returnCalculation.breakdown
    };
  }, [smartMarketData, buyAmount, selectedSide, yesPrice, noPrice]);


  // Handle max button
  const handleMaxAmount = () => {
    const maxBalance = getFullBalance();
    if (maxBalance > 0) {
      setBuyAmount(maxBalance.toString());
    }
  };

  // Social sharing function
  const handleShare = async () => {
    if (!smartMarketData) return;
    
    const shareText = `🎯 ${smartMarketData?.question}\n\nCurrent odds: ${yesPercentage.toFixed(1)}% Yes, ${noPercentage.toFixed(1)}% No\n\nTrade on Zyn: https://zynp.vercel.app/market/${smartMarketData?.id}`;
    
    if (isFarcasterApp) {
      try {
        await composeCast(shareText, [`https://zynp.vercel.app/market/${smartMarketData?.id}`]);
      } catch (error) {
        console.error('Error sharing to Farcaster:', error);
        showToast('Failed to share to Farcaster');
      }
    } else {
      // Fallback to native sharing or clipboard
      if (navigator.share) {
        try {
          await navigator.share({
            title: smartMarketData?.question,
            text: shareText,
            url: `https://zynp.vercel.app/market/${smartMarketData?.id}`
          });
        } catch (error) {
          // Fallback to clipboard
          navigator.clipboard.writeText(shareText);
          showToast('Link copied to clipboard!');
        }
      } else {
        navigator.clipboard.writeText(shareText);
        showToast('Link copied to clipboard!');
      }
    }
  };

  // Buy shares function
  const handleBuyShares = () => {
    if (!isConnected) {
      showToast('Please connect your wallet first');
      return;
    }
    
    if (parseFloat(buyAmount) <= 0) {
      showToast('Please enter a valid amount');
      return;
    }
    
    setIsBuying(true);
    // The actual buying logic is handled by OptimisticBuyButton
    // This function is just for validation and state management
  };

  // Loading state
  if (dataLoading || !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading market details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dataError || !smartMarketData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Market</h1>
          <p className="text-gray-600 mb-4">
            {dataError || 'Market not found or invalid ID.'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          
          {/* Main Content Area - Left Side */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Market Header */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                  {/* Market Image */}
                  {/* <div className="flex-shrink-0 self-center sm:self-start">
                    {smartMarketData?.image == "" ? (
                      <Image
                        src="https://a2ede-rqaaa-aaaal-ai6sq-cai.raw.icp0.io/uploads/food1.612.612.jpg"
                        alt={smartMarketData?.question}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Typography variant="caption" className="text-center text-gray-500">No Image</Typography>
                      </div>
                    )}
                  </div> */}
                  
                  {/* Market Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row items-start justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <Typography variant="h1" className="mb-2 text-center sm:text-left text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                          {smartMarketData?.question}
                        </Typography>
                        
                        {/* Market Metadata */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-3">
                          <Badge variant="success" size="sm">
                            {formatVolume(totalVolume)}
                          </Badge>
                          <Typography variant="body" className="text-gray-600">
                            {formatDate(smartMarketData?.endTime)}
                          </Typography>
                          <Typography variant="body" className="text-gray-600">
                            by {shortenAddress(smartMarketData?.creator)}
                          </Typography>
                        </div>
                        
                        {/* Market Statistics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          <div className="flex flex-col">
                        <Typography variant="caption" className="mb-1 text-gray-600">Total Volume</Typography>
                        <Typography variant="body" weight="semibold" className="text-gray-900">{formatVolume(totalVolume)}</Typography>
                          </div>
                          <div className="flex flex-col">
                            <Typography variant="caption" className="mb-1 text-gray-600">Yes Shares</Typography>
                            <Typography variant="body" weight="semibold" className="text-green-600">
                              {participants && participants.length > 0 
                                ? formatVolume(participants.reduce((sum, p) => sum + parseFloat(p.totalYesShares || '0'), 0))
                                : formatVolume(parseFloat(smartMarketData?.totalYes || '0'))
                              }
                            </Typography>
                          </div>
                          <div className="flex flex-col">
                            <Typography variant="caption" className="mb-1 text-gray-600">No Shares</Typography>
                            <Typography variant="body" weight="semibold" className="text-red-600">
                              {participants && participants.length > 0 
                                ? formatVolume(participants.reduce((sum, p) => sum + parseFloat(p.totalNoShares || '0'), 0))
                                : formatVolume(parseFloat(smartMarketData?.totalNo || '0'))
                              }
                            </Typography>
                          </div>
                          <div className="flex flex-col">
                            <Typography variant="caption" className="mb-1 text-gray-600">Participants</Typography>
                            <Typography variant="body" weight="semibold" className="text-gray-900">{participants.length}</Typography>
                          </div>
                        </div>
                        
                        {/* Refreshing indicator */}
                        {refreshingAfterPurchase && (
                          <div className="mt-2 flex items-center justify-center">
                            <div className="flex items-center space-x-2 text-blue-600 text-sm">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <Typography variant="body" className="text-blue-600">Updating from blockchain...</Typography>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Icons */}
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleShare}
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buy Shares Section - Mobile Only */}
            <div className="lg:hidden mb-6">
              <Card className="bg-white shadow-lg border-2 border-gray-200">
                <CardHeader className="bg-gray-50 border-b px-4 py-3">
                  <CardTitle className="text-gray-900 font-bold text-base">Buy Shares</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 bg-white p-4">
                  {/* Pick a side */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Typography variant="body" weight="semibold" className="text-gray-900">Pick a side</Typography>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={selectedSide === 'yes' ? 'primary' : 'outline'}
                        size="lg"
                        onClick={() => setSelectedSide('yes')}
                        className="flex flex-col items-center gap-1 py-3 h-auto min-h-[60px]"
                      >
                        <Typography variant="body" weight="semibold" className="text-sm">Yes</Typography>
                        <Typography variant="caption" className="text-xs">{(yesPrice * 100).toFixed(1)}¢</Typography>
                      </Button>
                      
                      <Button
                        variant={selectedSide === 'no' ? 'primary' : 'outline'}
                        size="lg"
                        onClick={() => setSelectedSide('no')}
                        className="flex flex-col items-center gap-1 py-3 h-auto min-h-[60px]"
                      >
                        <Typography variant="body" weight="semibold" className="text-sm">No</Typography>
                        <Typography variant="caption" className="text-xs">{(noPrice * 100).toFixed(1)}¢</Typography>
                      </Button>
                    </div>
                  </div>

                  {/* Amount input */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <Typography variant="body" weight="semibold" className="text-gray-900 text-sm">Amount (CELO)</Typography>
                      <div className="flex items-center justify-between sm:justify-end space-x-3">
                        <Typography variant="caption" className="text-gray-600 text-xs">
                          Balance: {formatBalance(balance)}
                        </Typography>
                        {isConnected && getFullBalance() > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={handleMaxAmount}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                          >
                            Max
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setBuyAmount((parseFloat(buyAmount) - 1).toString())}
                        className="w-8 h-8 p-0 text-black border-gray-300 hover:bg-gray-50"
                      >
                        <span className="text-sm font-semibold">-</span>
                      </Button>
                      
                      <input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-black text-sm font-medium bg-white"
                        placeholder="0"
                        min="0.01"
                        step="0.01"
                      />
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setBuyAmount((parseFloat(buyAmount) + 1).toString())}
                        className="w-8 h-8 p-0 text-black border-gray-300 hover:bg-gray-50"
                      >
                        <span className="text-sm font-semibold">+</span>
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Trade Summary */}
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <Typography variant="body" weight="semibold" className="text-gray-900 text-sm">Trade Summary</Typography>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <Typography variant="caption" className="text-gray-600 text-xs">Avg Price:</Typography>
                        <Typography variant="body" weight="semibold" className="text-gray-900 text-xs">{(tradingDetails.avgPrice * 100).toFixed(2)}¢</Typography>
                      </div>
                      
                      <div className="flex justify-between">
                        <Typography variant="caption" className="text-gray-600 text-xs">Shares:</Typography>
                        <Typography variant="body" weight="semibold" className="text-gray-900 text-xs">{tradingDetails.shares.toFixed(2)}</Typography>
                      </div>
                      
                      <div className="flex justify-between">
                        <Typography variant="caption" className="text-gray-600 text-xs">Transaction fees:</Typography>
                        <Typography variant="body" weight="semibold" className="text-gray-900 text-xs">${tradingDetails.fees.toFixed(4)}</Typography>
                      </div>
                      
                      {/* Smart Contract Breakdown */}
                      <div className="pt-2 border-t border-gray-200">
                        <Typography variant="caption" className="text-gray-500 font-medium text-xs">If you win:</Typography>
                        <div className="mt-1 space-y-1">
                          <div className="flex justify-between">
                            <Typography variant="caption" className="text-gray-600 text-xs">Your stake back:</Typography>
                            <Typography variant="body" weight="semibold" className="text-gray-900 text-xs">${tradingDetails.breakdown.originalStake.toFixed(2)}</Typography>
                          </div>
                          
                          {tradingDetails.breakdown.winningsFromLosers > 0 && (
                            <>
                              <div className="flex justify-between">
                                <Typography variant="caption" className="text-gray-600 text-xs">Winnings from losers:</Typography>
                                <Typography variant="body" weight="semibold" className="text-green-600 text-xs">+${tradingDetails.breakdown.winningsFromLosers.toFixed(2)}</Typography>
                              </div>
                              
                              <div className="flex justify-between">
                                <Typography variant="caption" className="text-gray-500 text-xs">Creator fee (15%):</Typography>
                                <Typography variant="caption" className="text-gray-500 text-xs">-${tradingDetails.breakdown.creatorFee.toFixed(2)}</Typography>
                              </div>
                              
                              <div className="flex justify-between">
                                <Typography variant="caption" className="text-gray-500 text-xs">Platform fee (15%):</Typography>
                                <Typography variant="caption" className="text-gray-500 text-xs">-${tradingDetails.breakdown.platformFee.toFixed(2)}</Typography>
                              </div>
                            </>
                          )}
                          
                          {tradingDetails.breakdown.winningsFromLosers === 0 && (
                            <div className="flex justify-between">
                              <Typography variant="caption" className="text-gray-500 text-xs">No losing shares = no additional winnings</Typography>
                              <Typography variant="caption" className="text-gray-500 text-xs">0% return</Typography>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between">
                          <Typography variant="caption" className="text-gray-600 font-medium text-xs">Total return:</Typography>
                          <Typography variant="body" weight="semibold" className={`text-xs ${tradingDetails.returnPercentage > 0 ? "text-green-600" : "text-gray-900"}`}>
                            ${tradingDetails.potentialReturn.toFixed(2)} ({tradingDetails.returnPercentage > 0 ? '+' : ''}{tradingDetails.returnPercentage.toFixed(1)}%)
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buy button */}
                  {!isConnected ? (
                    <Button variant="secondary" size="lg" fullWidth disabled className="py-3 text-sm font-semibold">
                      Connect Wallet to Trade
                    </Button>
                  ) : (
                    <OptimisticBuyButton
                      marketId={marketId}
                      amount={buyAmount}
                      side={selectedSide}
                      className="w-full py-3 text-sm font-semibold"
                      onRefreshTrigger={setRefreshTrigger}
                    />
                  )}

                  {/* Disclaimer */}
                  <Typography variant="caption" className="text-center block text-gray-500 text-xs mt-4">
                    *This is just a guide, not official rules
                  </Typography>
                </CardContent>
              </Card>
            </div>

            {/* Summary Section */}
            <Card className="bg-white shadow-lg">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <Button
                  variant="ghost"
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className="w-full justify-between p-0 h-auto"
                >
                  <Typography variant="h3" weight="semibold">Summary</Typography>
                  {summaryExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </CardHeader>
              
              {summaryExpanded && (
                <CardContent className="pt-0 px-4 pb-4 sm:px-6 sm:pb-6">
                  <div className="space-y-4">
                    <Typography variant="body" className="text-gray-700">
                      {smartMarketData?.description || 'No description available for this market.'}
                    </Typography>
                    
                    {smartMarketData?.source && (
                      <div>
                        <Typography variant="body" weight="semibold" className="mb-2 text-gray-900">Source:</Typography>
                        <a 
                          href={smartMarketData?.source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {smartMarketData?.source}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

           

            {/* OrderBook Section */}
           


            {/* Market Participants Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-lg font-semibold text-gray-900">Market Participants</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    {participantsLoading ? 'Loading...' : `${participants.length} participants`}
                  </span>
                  {justPurchased && (
                    <span className="text-green-600 text-xs font-medium">
                      Updating after purchase...
                    </span>
                  )}
                  {refreshingAfterPurchase && (
                    <span className="text-blue-600 text-xs font-medium">
                      Refreshing data from blockchain...
                    </span>
                  )}
                  <button
                    onClick={refreshData}
                    disabled={participantsLoading || isRefreshing}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {participantsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading participants...</p>
                </div>
              ) : participants.length > 0 ? (
                <div className="space-y-3">
                  <div className="max-h-80 overflow-y-auto">
                    {participants.map((participant: any, index: number) => {
                      // Convert subgraph participant data to expected format
                      const convertedParticipant = {
                        ...participant,
                        address: participant.user,
                        totalyesshares: participant.totalYesShares,
                        totalnoshares: participant.totalNoShares,
                        totalinvestment: participant.totalInvestment
                      };
                      
                      return (
                        <div 
                          key={convertedParticipant.address || convertedParticipant.id || index} 
                          className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {shortenAddress(convertedParticipant.address || 'Unknown')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {parseFloat(convertedParticipant.totalyesshares || 0) > 0 ? 'Yes' : 'No'} side
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatVolume(parseFloat(convertedParticipant.totalinvestment || 0))}
                            </div>
                            <div className="text-xs text-gray-500">
                              {parseFloat(convertedParticipant.totalyesshares || 0) > 0 ? 'Yes Shares' : 'No Shares'}
                            </div>
                          </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">👥</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h4>
                  <p className="text-gray-600">
                    Be the first to participate in this market!
                  </p>
                </div>
              )}
            </div>

            
          </div>

          {/* Right Sidebar - Trading Interface - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="bg-white shadow-lg border-2 border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-gray-900 font-bold">Buy Shares</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 bg-white">
                {/* Pick a side */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Typography variant="body" weight="semibold" className="text-gray-900">Pick a side</Typography>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedSide === 'yes' ? 'primary' : 'outline'}
                      size="lg"
                      onClick={() => setSelectedSide('yes')}
                      className="flex flex-col items-center gap-1"
                    >
                      <Typography variant="body" weight="semibold" className="text-gray-900">Yes</Typography>
                      <Typography variant="caption" className="text-gray-600">{(yesPrice * 100).toFixed(1)}¢</Typography>
                    </Button>
                    
                    <Button
                      variant={selectedSide === 'no' ? 'primary' : 'outline'}
                      size="lg"
                      onClick={() => setSelectedSide('no')}
                      className="flex flex-col items-center gap-1"
                    >
                      <Typography variant="body" weight="semibold" className="text-gray-900">No</Typography>
                      <Typography variant="caption" className="text-gray-600">{(noPrice * 100).toFixed(1)}¢</Typography>
                    </Button>
                  </div>
                </div>

                {/* Amount input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Typography variant="body" weight="semibold" className="text-gray-900">Amount (CELO)</Typography>
                    <div className="flex items-center space-x-2">
                      <Typography variant="caption" className="text-gray-600">
                        Balance: {formatBalance(balance)}
                      </Typography>
                      {isConnected && getFullBalance() > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleMaxAmount}
                        >
                          Max
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setBuyAmount((parseFloat(buyAmount) - 1).toString())}
                      className="w-8 text-black h-8 p-0"
                    >
                      -
                    </Button>
                    
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="flex-1 text-black px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center"
                      placeholder="0"
                      min="0.01"
                      step="0.01"
                    />
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setBuyAmount((parseFloat(buyAmount) + 1).toString())}
                      className="w-8 text-black h-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Trading details */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <Typography variant="body" weight="semibold" className="mb-3 text-gray-900">Trade Summary</Typography>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <Typography variant="caption" className="text-gray-600">Avg Price:</Typography>
                      <Typography variant="body" weight="semibold" className="text-gray-900">{(tradingDetails.avgPrice * 100).toFixed(2)}¢</Typography>
                    </div>
                    
                    <div className="flex justify-between">
                      <Typography variant="caption" className="text-gray-600">Shares:</Typography>
                      <Typography variant="body" weight="semibold" className="text-gray-900">{tradingDetails.shares.toFixed(2)}</Typography>
                    </div>
                    
                    <div className="flex justify-between">
                      <Typography variant="caption" className="text-gray-600">Transaction fees:</Typography>
                      <Typography variant="body" weight="semibold" className="text-gray-900">${tradingDetails.fees.toFixed(4)}</Typography>
                    </div>
                    
                    {/* Smart Contract Breakdown */}
                    <div className="pt-2 border-t border-gray-200">
                      <Typography variant="caption" className="text-gray-500 font-medium">If you win:</Typography>
                      <div className="mt-1 space-y-1">
                        <div className="flex justify-between">
                          <Typography variant="caption" className="text-gray-600">Your stake back:</Typography>
                          <Typography variant="body" weight="semibold" className="text-gray-900">${tradingDetails.breakdown.originalStake.toFixed(2)}</Typography>
                        </div>
                        
                        {tradingDetails.breakdown.winningsFromLosers > 0 && (
                          <>
                            <div className="flex justify-between">
                              <Typography variant="caption" className="text-gray-600">Winnings from losers:</Typography>
                              <Typography variant="body" weight="semibold" className="text-green-600">+${tradingDetails.breakdown.winningsFromLosers.toFixed(2)}</Typography>
                            </div>
                            
                            <div className="flex justify-between">
                              <Typography variant="caption" className="text-gray-500 text-xs">Creator fee (15%):</Typography>
                              <Typography variant="caption" className="text-gray-500 text-xs">-${tradingDetails.breakdown.creatorFee.toFixed(2)}</Typography>
                            </div>
                            
                            <div className="flex justify-between">
                              <Typography variant="caption" className="text-gray-500 text-xs">Platform fee (15%):</Typography>
                              <Typography variant="caption" className="text-gray-500 text-xs">-${tradingDetails.breakdown.platformFee.toFixed(2)}</Typography>
                            </div>
                          </>
                        )}
                        
                        {tradingDetails.breakdown.winningsFromLosers === 0 && (
                          <div className="flex justify-between">
                            <Typography variant="caption" className="text-gray-500 text-xs">No losing shares = no additional winnings</Typography>
                            <Typography variant="caption" className="text-gray-500 text-xs">0% return</Typography>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <Typography variant="caption" className="text-gray-600 font-medium">Total return:</Typography>
                        <Typography variant="body" weight="semibold" className={tradingDetails.returnPercentage > 0 ? "text-green-600" : "text-gray-900"}>
                          ${tradingDetails.potentialReturn.toFixed(2)} ({tradingDetails.returnPercentage > 0 ? '+' : ''}{tradingDetails.returnPercentage.toFixed(1)}%)
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buy button */}
                {!isConnected ? (
                  <Button variant="secondary" size="lg" fullWidth disabled>
                    Connect Wallet to Trade
                  </Button>
                ) : (
                  <OptimisticBuyButton
                    marketId={marketId}
                    amount={buyAmount}
                    side={selectedSide}
                    className="w-full"
                    onRefreshTrigger={setRefreshTrigger}
                  />
                )}

                {/* Disclaimer */}
                <Typography variant="caption" className="text-center block text-gray-500">
                  *This is just a guide, not official rules
                </Typography>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetail;