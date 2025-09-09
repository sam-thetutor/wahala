'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';

// Custom Hooks
import { useMarketDetails } from '@/hooks/useMarketDetails';
import { usePredictionMarket } from '@/hooks/usePredictionMarket';
import { useNotificationHelpers } from '@/hooks/useNotificationHelpers';
import { useFarcaster } from '@/components/FarcasterProvider';

// Icons
import { Share2, CheckCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { formatGwei } from 'viem';

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
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
    chainId: 42220

  });

  // Prediction market hooks
  const { buyShares, updateDatabaseAfterPurchase, contractState } = usePredictionMarket();
  const { notifyTransactionSuccess } = useNotificationHelpers();

  // Local state
  const [market, setMarket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderBookExpanded, setOrderBookExpanded] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  
  // Trading state
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no'>('yes');
  const [buyAmount, setBuyAmount] = useState('1');
  const [isBuying, setIsBuying] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);
  const [optimisticUpdate, setOptimisticUpdate] = useState<any>(null);
  const [pendingTransaction, setPendingTransaction] = useState<string | null>(null);

  // Market data from our custom hook
  const {
    market: smartMarketData,
    participants,
    loading: dataLoading,
    participantsLoading,
    error: dataError,
    lastUpdated,
    refresh: refreshData,
    pollingStatus,
    isPolling,
    isPageVisible,
    isRefreshing,
    hasUpdates,
    initialLoadComplete
  } = useMarketDetails({
    marketId: marketId || '',
    enabled: true,
    pollingInterval: justPurchased ? 1000 : 3000 // More aggressive polling after purchase
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

  console.log('🔄 Market data:', smartMarketData);
  // Update local market state when data loads
  useEffect(() => {
    if (smartMarketData) {
      console.log('📊 Market data loaded:', {
        id: smartMarketData.id,
        question: smartMarketData.question,
        image: smartMarketData.image == "" ? "https://a2ede-rqaaa-aaaal-ai6sq-cai.raw.icp0.io/uploads/food1.612.612.jpg" : smartMarketData.image,
        totalyes: smartMarketData.totalyes,
        totalno: smartMarketData.totalno,
        creator: smartMarketData.creator,
        endtime: smartMarketData.endtime,
        description: smartMarketData.description
      });
      setMarket(smartMarketData);
      setIsLoading(false);
    }
  }, [smartMarketData]);

  // Handle errors
  useEffect(() => {
    if (dataError) {
      setIsLoading(false);
    }
  }, [dataError]);

  // Handle transaction confirmation and database updates
  useEffect(() => {
    if (contractState.success && contractState.transactionHash && pendingTransaction) {
      console.log('✅ Transaction confirmed, updating database...');
      
      // Update database after transaction confirmation
      const updateDatabase = async () => {
        // Use the amount from optimistic update to ensure we have the correct value
        const amount = parseFloat(optimisticUpdate?.amount || buyAmount);
        console.log('🔄 Database update - using amount:', amount, 'from optimistic update:', optimisticUpdate?.amount, 'or form:', buyAmount);
        
        const success = await updateDatabaseAfterPurchase({
          marketId: parseInt(marketId),
          outcome: optimisticUpdate?.outcome ?? (selectedSide === 'yes'),
          amount: amount.toString()
        }, contractState.transactionHash!);
        
        if (success) {
          console.log('✅ Database updated successfully');
          // Clear optimistic update and trigger refresh
          setOptimisticUpdate(null);
          setPendingTransaction(null);
          setJustPurchased(true);
          
          // Refresh data immediately
          refreshData();
          
          // Reset aggressive polling after 30 seconds
          setTimeout(() => {
            setJustPurchased(false);
          }, 30000);
        } else {
          console.error('❌ Database update failed');
          // Still clear optimistic update to avoid confusion
          setOptimisticUpdate(null);
          setPendingTransaction(null);
        }
      };
      
      updateDatabase();
    }
  }, [contractState.success, contractState.transactionHash, pendingTransaction, updateDatabaseAfterPurchase, marketId, selectedSide, buyAmount, refreshData]);

  // Calculate market statistics with optimistic updates
  const yesPercentage = useMemo(() => {
    if (!market) return 50;
    
    let totalYesShares = 0;
    let totalNoShares = 0;
    
    // Calculate from participants data if available (more accurate)
    if (participants && participants.length > 0) {
      totalYesShares = participants.reduce((sum, participant) => {
        return sum + parseFloat(participant.totalyesshares || 0);
      }, 0);
      totalNoShares = participants.reduce((sum, participant) => {
        return sum + parseFloat(participant.totalnoshares || 0);
      }, 0);
    } else {
      // Fallback to market data
      totalYesShares = parseFloat(market.totalyes || 0);
      totalNoShares = parseFloat(market.totalno || 0);
    }
    
    // Apply optimistic update if available
    if (optimisticUpdate) {
      // Convert CELO amount to wei for consistency with database storage
      const amountInWei = parseFloat(optimisticUpdate.amount) * 1e18;
      if (optimisticUpdate.outcome) {
        totalYesShares += amountInWei;
      } else {
        totalNoShares += amountInWei;
      }
    }
    
    const total = totalYesShares + totalNoShares;
    return total > 0 ? (totalYesShares / total) * 100 : 50;
  }, [market, participants, optimisticUpdate]);

  const noPercentage = useMemo(() => {
    return 100 - yesPercentage;
  }, [yesPercentage]);

  const totalVolume = useMemo(() => {
    if (!market) return 0;
    
    let total = 0;
    
    // Calculate total volume from participants data if available (more accurate)
    if (participants && participants.length > 0) {
      total = participants.reduce((sum, participant) => {
        return sum + parseFloat(participant.totalinvestment || 0);
      }, 0);
    } else {
      // Fallback to market data
      total = parseFloat(market.totalyes || 0) + parseFloat(market.totalno || 0);
    }
    
    // Apply optimistic update if available
    if (optimisticUpdate) {
      // Convert CELO amount to wei for consistency with database storage
      total += parseFloat(optimisticUpdate.amount) * 1e18;
    }
    
    return total;
  }, [market, participants, optimisticUpdate]);

  // Format volume with proper wei to CELO conversion
  const formatVolume = (volume: number) => {
    // Convert from wei to CELO (divide by 1e18)
    const celoAmount = volume / 1e18;
    
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
    if (!market || !market.totalyes || !market.totalno) return 0.5;
    const total = parseFloat(market.totalyes) + parseFloat(market.totalno);
    return total > 0 ? parseFloat(market.totalyes) / total : 0.5;
  }, [market]);

  const noPrice = useMemo(() => {
    return 1 - yesPrice;
  }, [yesPrice]);

  // Calculate trading details
  const tradingDetails = useMemo(() => {
    if (!market || !buyAmount || isNaN(parseFloat(buyAmount))) {
      return {
        shares: 0,
        avgPrice: 0,
        fees: 0,
        potentialReturn: 0,
        returnPercentage: 0
      };
    }

    const amount = parseFloat(buyAmount);
    const currentPrice = selectedSide === 'yes' ? yesPrice : noPrice;
    const shares = amount / currentPrice;
    const fees = amount * 0.0021; // 0.21% fee
    const potentialReturn = shares * 1; // If correct, each share pays $1
    const returnPercentage = ((potentialReturn - amount) / amount) * 100;

    return {
      shares: shares,
      avgPrice: currentPrice,
      fees: fees,
      potentialReturn: potentialReturn,
      returnPercentage: returnPercentage
    };
  }, [market, buyAmount, selectedSide, yesPrice, noPrice]);

  // Handle buy shares with optimistic updates
  const handleBuyShares = async () => {
    if (!market || !buyAmount || isNaN(parseFloat(buyAmount)) || !isConnected) return;
    
    const amount = parseFloat(buyAmount);
    const userBalance = getFullBalance();
    
    if (amount > userBalance) {
      alert('Insufficient balance');
      return;
    }
    
    // Ensure we have a valid market ID
    if (!market.id) {
      console.error('Market ID is undefined');
      alert('Invalid market ID');
      return;
    }
    
    setIsBuying(true);
    
    // Apply optimistic update immediately
    const optimisticData = {
      outcome: selectedSide === 'yes',
      amount: amount.toString()
    };
    setOptimisticUpdate(optimisticData);
    
    // Store the original amount for database update (before form reset)
    const originalAmount = amount.toString();
    
    try {
      console.log('Buying shares:', {
        marketId: market.id,
        side: selectedSide,
        amount: amount,
        amountString: amount.toString(),
        shares: tradingDetails.shares,
        userBalance: userBalance
      });
      
      // Convert market ID to number if it's a string
      const marketId = typeof market.id === 'string' ? parseInt(market.id) : market.id;
      
      // Call the actual buyShares function from the smart contract
      const result = await buyShares({
        marketId: marketId,
        outcome: selectedSide === 'yes', // true for yes, false for no
        amount: amount.toString() // amount as string
      });
      
      if (result.success && result.transactionHash) {
        // Store transaction hash for confirmation tracking
        setPendingTransaction(result.transactionHash);
        
        // Show success notification
        notifyTransactionSuccess('Transaction submitted! Waiting for confirmation...');
        
        // Reset form
        setBuyAmount('1');
      } else {
        // Transaction failed, remove optimistic update
        setOptimisticUpdate(null);
        alert(result.error || 'Failed to purchase shares. Please try again.');
      }
      
    } catch (error) {
      console.error('Error buying shares:', error);
      // Remove optimistic update on error
      setOptimisticUpdate(null);
      alert('Failed to purchase shares. Please try again.');
    } finally {
      setIsBuying(false);
    }
  };

  // Handle max button
  const handleMaxAmount = () => {
    const maxBalance = getFullBalance();
    if (maxBalance > 0) {
      setBuyAmount(maxBalance.toString());
    }
  };

  // Social sharing function
  const handleShare = async () => {
    if (!market) return;
    
    const shareText = `🎯 ${market.question}\n\nCurrent odds: ${yesPercentage.toFixed(1)}% Yes, ${noPercentage.toFixed(1)}% No\n\nTrade on Zyn: https://zynp.vercel.app/market/${market.id}`;
    
    if (isFarcasterApp) {
      try {
        await composeCast(shareText, [`https://zynp.vercel.app/market/${market.id}`]);
      } catch (error) {
        console.error('Error sharing to Farcaster:', error);
        showToast('Failed to share to Farcaster');
      }
    } else {
      // Fallback to native sharing or clipboard
      if (navigator.share) {
        try {
          await navigator.share({
            title: market.question,
            text: shareText,
            url: `https://zynp.vercel.app/market/${market.id}`
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

  // Loading state
  if (isLoading || !initialLoadComplete) {
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
  if (dataError || !market) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Market Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Market Image */}
                <div className="flex-shrink-0 self-center sm:self-start">
                  {market.image == "" ? (
                    <Image
                      src="https://a2ede-rqaaa-aaaal-ai6sq-cai.raw.icp0.io/uploads/food1.612.612.jpg"
                      alt={market.question}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs text-center">No Image</span>
                    </div>
                  )}
                </div>
                
                {/* Market Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row items-start justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center sm:text-left">
                        {market.question}
                      </h1>
                      
                      {/* Market Metadata */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start text-sm text-gray-500 mb-3 space-x-2 sm:space-x-4">
                        <span className="font-semibold text-green-600">
                          {formatVolume(totalVolume)}
                        </span>
                        <span>
                          {formatDate(market.endtime)}
                        </span>
                        <span>by {shortenAddress(market.creator)}</span>
                      </div>
                      
                      {/* Market Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-600 text-xs">Total Volume</span>
                          <span className="font-semibold text-gray-900">{formatVolume(totalVolume)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-600 text-xs">Yes Shares</span>
                          <span className="font-semibold text-green-600">
                            {participants && participants.length > 0 
                              ? formatVolume(participants.reduce((sum, p) => sum + parseFloat(p.totalyesshares || 0), 0))
                              : formatVolume(parseFloat(market?.totalyes || 0))
                            }
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-600 text-xs">No Shares</span>
                          <span className="font-semibold text-red-600">
                            {participants && participants.length > 0 
                              ? formatVolume(participants.reduce((sum, p) => sum + parseFloat(p.totalnoshares || 0), 0))
                              : formatVolume(parseFloat(market?.totalno || 0))
                            }
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-600 text-xs">Participants</span>
                          <span className="font-semibold text-gray-900">{participants.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Icons */}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={handleShare}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buy Shares Section - Mobile Only */}
            <div className="lg:hidden">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Buy Shares</h3>
                
                {/* Pick a side */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Pick a side</span>
                    <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedSide('yes')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedSide === 'yes'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">Yes</div>
                        <div className="text-sm text-gray-500">{(yesPrice * 100).toFixed(1)}¢</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setSelectedSide('no')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedSide === 'no'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">No</div>
                        <div className="text-sm text-gray-500">{(noPrice * 100).toFixed(1)}¢</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Amount input */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Amount (CELO)</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        Balance: {formatBalance(balance)}
                      </span>
                      {isConnected && getFullBalance() > 0 && (
                        <button 
                          onClick={handleMaxAmount}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Max
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setBuyAmount((parseFloat(buyAmount) - 1).toString())}
                      className="w-8 h-8 text-black rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                      placeholder="0"
                      min="0.01"
                      step="0.01"
                    />
                    
                    <button 
                      onClick={() => setBuyAmount((parseFloat(buyAmount) + 1).toString())}
                      className="w-8 text-black h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Trading details */}
                {/* <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Price:</span>
                    <span className="font-medium">{(tradingDetails.avgPrice * 100).toFixed(2)}¢</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shares:</span>
                    <span className="font-medium">{tradingDetails.shares.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated fees:</span>
                    <span className="font-medium">${tradingDetails.fees.toFixed(4)}</span>
                  </div>
                  
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900">Potential return:</span>
                    <span className="text-green-600">
                      ${tradingDetails.potentialReturn.toFixed(2)} ({tradingDetails.returnPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div> */}

                {/* Buy button */}
                {!isConnected ? (
                  <div className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-500 text-center font-semibold">
                    Connect Wallet to Trade
                  </div>
                ) : (
                  <button
                    onClick={handleBuyShares}
                    disabled={isBuying || !buyAmount || isNaN(parseFloat(buyAmount)) || parseFloat(buyAmount) <= 0 || parseFloat(buyAmount) > getFullBalance() || !!optimisticUpdate}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      isBuying || !buyAmount || isNaN(parseFloat(buyAmount)) || parseFloat(buyAmount) <= 0 || parseFloat(buyAmount) > getFullBalance() || !!optimisticUpdate
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : selectedSide === 'yes'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isBuying ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Buying...
                      </div>
                    ) : optimisticUpdate ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Confirming...
                      </div>
                    ) : parseFloat(buyAmount) > getFullBalance() ? (
                      'Insufficient Balance'
                    ) : (
                      `Buy ${selectedSide.toUpperCase()}`
                    )}
                  </button>
                )}

                {/* Disclaimer */}
                
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => setSummaryExpanded(!summaryExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">Summary</span>
                {summaryExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {summaryExpanded && (
                <div className="px-6 pb-4 border-t border-gray-200">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 mb-4">
                      {market.description || 'No description available for this market.'}
                    </p>
                    
                    {market.source && (
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Source:</strong>{' '}
                        <a 
                          href={market.source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {market.source}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Probability/Chance Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center sm:text-left">
                  {yesPercentage.toFixed(1)}% chance
                </h2>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-8 flex overflow-hidden">
                  <div 
                    className="bg-green-500 flex items-center justify-center text-white font-semibold text-sm"
                    style={{ width: `${yesPercentage}%` }}
                  >
                    {yesPercentage > 15 ? 'Yes' : ''}
                  </div>
                  <div 
                    className="bg-blue-500 flex items-center justify-center text-white font-semibold text-sm"
                    style={{ width: `${noPercentage}%` }}
                  >
                    {noPercentage > 15 ? 'No' : ''}
                  </div>
                </div>
                
                {/* Labels */}
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>Yes</span>
                  <span>No</span>
                </div>
              </div>
            </div>

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
                  {optimisticUpdate && (
                    <span className="text-blue-600 text-xs font-medium">
                      Pending transaction...
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
                    {participants.map((participant: any, index: number) => (
                      <div 
                        key={participant.address || participant.id || index} 
                        className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {shortenAddress(participant.address || 'Unknown')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {parseFloat(participant.totalyesshares || 0) > parseFloat(participant.totalnoshares || 0) ? 'Yes' : 
                               parseFloat(participant.totalnoshares || 0) > parseFloat(participant.totalyesshares || 0) ? 'No' : 'Neutral'} side
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatVolume(parseFloat(participant.totalinvestment || 0))}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total Investment
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <div className="text-green-600">
                            Yes: {formatVolume(parseFloat(participant.totalyesshares || 0))}
                          </div>
                          <div className="text-red-600">
                            No: {formatVolume(parseFloat(participant.totalnoshares || 0))}
                          </div>
                        </div>
                      </div>
                    ))}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Buy Shares</h3>
              
              {/* Pick a side */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Pick a side</span>
                  <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedSide('yes')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedSide === 'yes'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold">Yes</div>
                      <div className="text-sm text-gray-500">{(yesPrice * 100).toFixed(1)}¢</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSide('no')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedSide === 'no'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold">No</div>
                      <div className="text-sm text-gray-500">{(noPrice * 100).toFixed(1)}¢</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Amount ($)</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      Balance: {formatBalance(balance)}
                    </span>
                    {isConnected && getFullBalance() > 0 && (
                      <button 
                        onClick={handleMaxAmount}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Max
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setBuyAmount((parseFloat(buyAmount) - 1).toString())}
                    className="w-8 h-8 text-black rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                    placeholder="0"
                    min="0.01"
                    step="0.01"
                  />
                  
                  <button 
                    onClick={() => setBuyAmount((parseFloat(buyAmount) + 1).toString())}
                    className="w-8 text-black h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Trading details */}
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Price:</span>
                  <span className="font-medium">{(tradingDetails.avgPrice * 100).toFixed(2)}¢</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shares:</span>
                  <span className="font-medium">{tradingDetails.shares.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated fees:</span>
                  <span className="font-medium">${tradingDetails.fees.toFixed(4)}</span>
                </div>
                
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900">Potential return:</span>
                  <span className="text-green-600">
                    ${tradingDetails.potentialReturn.toFixed(2)} ({tradingDetails.returnPercentage.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Buy button */}
              {!isConnected ? (
                <div className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-500 text-center font-semibold">
                  Connect Wallet to Trade
                </div>
              ) : (
                <button
                  onClick={handleBuyShares}
                  disabled={isBuying || !buyAmount || isNaN(parseFloat(buyAmount)) || parseFloat(buyAmount) <= 0 || parseFloat(buyAmount) > getFullBalance() || !!optimisticUpdate}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    isBuying || !buyAmount || isNaN(parseFloat(buyAmount)) || parseFloat(buyAmount) <= 0 || parseFloat(buyAmount) > getFullBalance() || !!optimisticUpdate
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : selectedSide === 'yes'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isBuying ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Buying...
                    </div>
                  ) : optimisticUpdate ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Confirming...
                    </div>
                  ) : parseFloat(buyAmount) > getFullBalance() ? (
                    'Insufficient Balance'
                  ) : (
                    `Buy ${selectedSide.toUpperCase()}`
                  )}
                </button>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-gray-500 mt-4 text-center">
                *This is just a guide, not official rules
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetail;