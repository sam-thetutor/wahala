'use client'

import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useMiniApp } from '@/contexts/MiniAppContext';
import { MiniAppProvider } from '@/contexts/MiniAppContext';
import { useFarcaster } from '@/components/FarcasterProvider';
import NotificationContainer, { useNotifications } from '@/components/NotificationContainer';
import { CreatorFeeClaim } from '@/components/CreatorFeeClaim';
import { formatEther } from 'viem';
import Link from 'next/link';
import { useSubgraphUserStats } from '@/hooks/useSubgraphUserStats';
import { useSubgraphUserActivity } from '@/hooks/useSubgraphUserActivity';
import { useSubgraphUserMarkets } from '@/hooks/useSubgraphUserMarkets';
import { useSubgraphUserClaims } from '@/hooks/useSubgraphUserClaims';
import { useSubgraphUserPerformance } from '@/hooks/useSubgraphUserPerformance';
import { formatVolume, formatDate, shortenAddress, formatPercentage } from '@/lib/utils';
import ClaimsSection from '@/components/ClaimsSection';

const ProfileContent: React.FC = () => {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { 
    isMiniApp, 
    addToFarcaster,
    triggerHaptic
  } = useMiniApp();
  const { isFarcasterApp, getUserDisplayName, getUserEmoji, isInFarcasterContext, context } = useFarcaster();
  const { notifications, removeNotification } = useNotifications();
  
  // Get Farcaster wallet address if available
  const farcasterAddress = isInFarcasterContext() && context?.user?.walletAddress 
    ? context.user.walletAddress 
    : address;
  
  // Fetch Celo balance
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: farcasterAddress,
    chainId: 42220
  });
  
  // Use enhanced subgraph hooks for comprehensive data
  const { 
    stats: userStats, 
    loading: statsLoading, 
    error: statsError,
    refetch: refetchStats,
    lastUpdated: statsLastUpdated
  } = useSubgraphUserStats();
  
  const { 
    activities, 
    loading: activitiesLoading, 
    error: activitiesError,
    refetch: refetchActivities,
    loadMore,
    hasMore,
    setFilters: setActivityFilters,
    filters: activityFilters
  } = useSubgraphUserActivity();
  
  const {
    markets: userMarkets,
    loading: marketsLoading,
    error: marketsError,
    refetch: refetchMarkets,
    stats: marketsStats
  } = useSubgraphUserMarkets();
  
  const {
    claims,
    availableClaims,
    loading: claimsLoading,
    error: claimsError,
    refetch: refetchClaims,
    stats: claimsStats
  } = useSubgraphUserClaims();
  
  const {
    performance,
    loading: performanceLoading,
    error: performanceError,
    refetch: refetchPerformance
  } = useSubgraphUserPerformance();
  
  
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'markets' | 'claims'>('overview');
  const [isPolling, setIsPolling] = useState(false);

  // Combined loading state
  const loading = activitiesLoading || statsLoading || marketsLoading || claimsLoading || performanceLoading;
  
  // Combined error state
  const error = activitiesError || statsError || marketsError || claimsError || performanceError;

  // Polling effect for real-time updates
  useEffect(() => {
    if (!farcasterAddress) return;

    let timeoutId: NodeJS.Timeout;
    
    const debouncedPoll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsPolling(true);
        Promise.all([
          refetchActivities(),
          refetchStats(),
          refetchMarkets(),
          refetchClaims(),
          refetchPerformance()
        ]).finally(() => {
          setIsPolling(false);
        });
      }, 2000); // 2 second debounce
    };

    const pollInterval = setInterval(debouncedPoll, 300000); // Poll every 5 minutes (further reduced)

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [farcasterAddress, refetchActivities, refetchStats]);

  // Handle wallet not connected
  if (!isConnected || !farcasterAddress) {
    return (
      <div className="py-6 px-3 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-yellow-800 mb-2">
              {isMiniApp ? 'Embedded Wallet Not Connected' : 'Wallet Not Connected'}
            </h2>
            <p className="text-sm md:text-base text-yellow-700">
              {isMiniApp 
                ? 'The embedded wallet is not connected. Please try refreshing the app.'
                : 'Please connect your wallet to view your profile and activities.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header - Mobile Optimized */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Profile</h1>
              <div className="flex items-center space-x-3">
                {isFarcasterApp ? (
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg">
                    {getUserEmoji()}
                  </div>
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg">
                    {farcasterAddress.slice(2, 4).toUpperCase()}
                  </div>
                )}
                <div>
                  {isFarcasterApp ? (
                    <>
                      <p className="text-sm md:text-base lg:text-lg font-medium text-gray-900">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">
                        Farcaster User • {shortenAddress(farcasterAddress)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm md:text-base lg:text-lg font-medium text-gray-900">
                        {shortenAddress(farcasterAddress)}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">Connected Wallet</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              {/* Polling Indicator */}
              {isPolling && (
                <div className="flex items-center text-xs text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-emerald-600 mr-1"></div>
                  Updating...
                </div>
              )}
              
              {isMiniApp && (
                <button
                  onClick={async () => {
                    try {
                      await addToFarcaster();
                      await triggerHaptic('medium');
                    } catch (error) {
                      console.error('Failed to add to Farcaster:', error);
                    }
                  }}
                  className="px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs md:text-sm"
                >
                  Add to Farcaster
                </button>
              )}
              <button
                onClick={() => {
                  refetchActivities();
                  refetchStats();
                  refetchMarkets();
                  refetchClaims();
                  refetchPerformance();
                }}
                className="px-3 md:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs md:text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Optimized */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-4 md:mb-6">
          <nav className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', count: null },
              { id: 'activities', label: 'Activities', count: activities.length },
              { id: 'markets', label: 'My Markets', count: userMarkets.length },
              { id: 'claims', label: 'Claims', count: availableClaims.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-2 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-1 md:ml-2 bg-gray-200 text-gray-700 px-1 md:px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4 md:space-y-6 mb-4 md:mb-6">
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {/* Balance Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <span className="text-lg md:text-xl">💎</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Balance</p>
                    <p className="text-sm md:text-lg font-bold text-gray-900">
                      {balanceLoading ? '...' : balance ? `${parseFloat(balance.formatted).toFixed(3)} ${balance.symbol}` : '0 CELO'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Markets Created */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <span className="text-lg md:text-xl">📊</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Markets</p>
                    <p className="text-sm md:text-lg font-bold text-gray-900">{userStats?.totalMarketsCreated || 0}</p>
                  </div>
                </div>
              </div>

              {/* Total Trades */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-lg md:text-xl">💰</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Trades</p>
                    <p className="text-sm md:text-lg font-bold text-gray-900">{userStats?.totalTrades || 0}</p>
                  </div>
                </div>
              </div>

              {/* Total Volume */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-lg md:text-xl">📈</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Volume</p>
                    <p className="text-sm md:text-lg font-bold text-gray-900">{formatVolume(userStats?.totalVolume || '0')}</p>
                  </div>
                </div>
              </div>

              {/* Win Rate */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-lg md:text-xl">🎯</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Win Rate</p>
                    <p className="text-sm md:text-lg font-bold text-gray-900">{formatPercentage(userStats?.winRate || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Total Winnings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <span className="text-lg md:text-xl">🏆</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Winnings</p>
                    <p className="text-sm md:text-lg font-bold text-gray-900">{formatVolume(userStats?.totalWinnings || '0')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats Row */}
            {userStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600">Avg Trade Size</p>
                    <p className="text-sm md:text-base font-bold text-gray-900">{formatVolume(userStats.averageTradeSize)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600">Trading Days</p>
                    <p className="text-sm md:text-base font-bold text-gray-900">{userStats.tradingDays}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600">Risk Profile</p>
                    <p className="text-sm md:text-base font-bold text-gray-900">{userStats.riskTolerance}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600">Success Rate</p>
                    <p className="text-sm md:text-base font-bold text-gray-900">{formatPercentage(userStats.marketCreationSuccessRate)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Performance Metrics */}
            
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Recent Activities</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={activityFilters.type || ''}
                  onChange={(e) => setActivityFilters({ ...activityFilters, type: e.target.value as any || undefined })}
                  className="text-xs md:text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="">All Activities</option>
                  <option value="trading">Trading</option>
                  <option value="market_created">Market Created</option>
                  <option value="market_resolved">Market Resolved</option>
                </select>
                <button
                  onClick={refetchActivities}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Refresh"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-6 md:py-8">
                <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-emerald-600 mx-auto mb-3 md:mb-4"></div>
                <p className="text-sm md:text-base text-gray-600">Loading activities...</p>
              </div>
            ) : error ? (
              <div className="text-center py-6 md:py-8">
                <div className="text-red-400 text-3xl md:text-4xl mb-3 md:mb-4">⚠️</div>
                <h4 className="text-base md:text-lg font-medium text-gray-900 mb-2">Error Loading Activities</h4>
                <p className="text-sm md:text-base text-gray-600 mb-4">{error}</p>
                <button
                  onClick={refetchActivities}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {activities.map((activity) => {
                  const activityDate = new Date(activity.timestamp * 1000);
                  
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center p-3 md:p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`text-lg md:text-2xl mr-3 md:mr-4 p-2 rounded-lg bg-gray-100`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm md:text-base text-gray-900">
                              {activity.description}
                            </p>
                            <p className="text-xs md:text-sm text-gray-600 mt-1">
                              {activity.marketQuestion}
                            </p>
                            {activity.amount && (
                              <p className="text-xs text-gray-500 mt-1">
                                Amount: {formatVolume(activity.amount)} CELO
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800`}>
                              {activity.marketStatus}
                            </span>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8">
                <div className="text-gray-400 text-3xl md:text-4xl mb-3 md:mb-4">📝</div>
                <h4 className="text-base md:text-lg font-medium text-gray-900 mb-2">No Activities Yet</h4>
                <p className="text-sm md:text-base text-gray-600 mb-4">
                  Start participating in prediction markets to see your activities here.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/create-market"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                  >
                    Create Market
                  </Link>
                  <Link
                    href="/markets"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Browse Markets
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'markets' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Markets Created</h2>
            
            {loading ? (
              <div className="text-center py-6 md:py-8">
                <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-emerald-600 mx-auto mb-3 md:mb-4"></div>
                <p className="text-sm md:text-base text-gray-600">Loading markets...</p>
              </div>
            ) : userMarkets.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {userMarkets.map((market) => {
                  return (
                    <div
                      key={market.id}
                      className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm md:text-base text-gray-900 mb-2">
                            {market.question}
                          </h3>
                          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-xs md:text-sm text-gray-500 space-y-1 md:space-y-0">
                            <span>Created: {formatDate(market.createdAt)}</span>
                            <span>Market ID: {market.id}</span>
                            <span>End Time: {formatDate(market.endTime)}</span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                            <span>Pool: {formatVolume(market.totalPool)}</span>
                            <span>Yes: {formatVolume(market.totalYes)}</span>
                            <span>No: {formatVolume(market.totalNo)}</span>
                            <span>Participants: {market.participantCount}</span>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Engagement: {market.engagementScore}/100</span>
                            <span>Creator Fees: {formatVolume(market.creatorFeesClaimed)} CELO</span>
                            {market.pendingCreatorFees !== '0' && (
                              <span className="text-green-600">Pending: {formatVolume(market.pendingCreatorFees)} CELO</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            market.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                            market.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {market.status}
                          </span>
                          <Link
                            href={`/market/${market.id}`}
                            className="px-2 md:px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                      
                      {/* Creator Fee Claim for Resolved Markets */}
                      {market.status === 'RESOLVED' && market.pendingCreatorFees !== '0' && (
                        <CreatorFeeClaim
                          marketId={BigInt(market.id)}
                          marketQuestion={market.question}
                          className="mt-3"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8">
                <div className="text-gray-400 text-3xl md:text-4xl mb-3 md:mb-4">📊</div>
                <h4 className="text-base md:text-lg font-medium text-gray-900 mb-2">No Markets Created</h4>
                <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                  Create your first prediction market to get started.
                </p>
                <Link
                  href="/create-market"
                  className="inline-block px-4 md:px-6 py-2 md:py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-sm md:text-base"
                >
                  Create Market
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="space-y-4 md:space-y-6">
            {/* Claims Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">Total Claimed</p>
                  <p className="text-sm md:text-lg font-bold text-gray-900">{formatVolume(claimsStats.totalClaimed)}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">Available</p>
                  <p className="text-sm md:text-lg font-bold text-green-600">{formatVolume(claimsStats.totalAvailable)}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">Winnings</p>
                  <p className="text-sm md:text-lg font-bold text-yellow-600">{formatVolume(claimsStats.totalWinningsClaimed)}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">Creator Fees</p>
                  <p className="text-sm md:text-lg font-bold text-purple-600">{formatVolume(claimsStats.totalCreatorFeesClaimed)}</p>
                </div>
              </div>
            </div>

            {/* Available Claims */}
            {availableClaims.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Claims</h3>
                <div className="space-y-3">
                  {availableClaims.map((claim) => (
                    <div key={claim.marketId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{claim.marketQuestion}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span>Winnings: {formatVolume(claim.winningsAmount)} CELO</span>
                            <span>Creator Fee: {formatVolume(claim.creatorFeeAmount)} CELO</span>
                            <span className="font-semibold text-green-600">Total: {formatVolume(claim.totalAmount)} CELO</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            claim.canClaim ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {claim.canClaim ? 'Claimable' : 'Not Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Claim History */}
            {claims.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim History</h3>
                <div className="space-y-3">
                  {claims.map((claim) => (
                    <div key={claim.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{claim.marketQuestion}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span>Type: {claim.type === 'winnings' ? 'Winnings' : 'Creator Fee'}</span>
                            <span>Amount: {formatVolume(claim.amount)} CELO</span>
                            <span>Date: {formatDate(claim.claimedAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Claimed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableClaims.length === 0 && claims.length === 0 && (
              <div className="text-center py-6 md:py-8">
                <div className="text-gray-400 text-3xl md:text-4xl mb-3 md:mb-4">🏆</div>
                <h4 className="text-base md:text-lg font-medium text-gray-900 mb-2">No Claims Available</h4>
                <p className="text-sm md:text-base text-gray-600 mb-4">
                  Participate in prediction markets to earn winnings and creator fees.
                </p>
              </div>
            )}
          </div>
        )}

        <NotificationContainer 
          notifications={notifications} 
          onRemove={removeNotification} 
        />
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  return (
    <MiniAppProvider>
      <ProfileContent />
    </MiniAppProvider>
  );
};

export default Profile;
