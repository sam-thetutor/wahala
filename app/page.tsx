'use client';

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Users, 
  Plus, 
  Sparkles, 
  Trophy, 
  Star, 
  Clock,
  Gamepad2,
  ArrowDown,
  ArrowRight,
  Award,
  Zap,
  Shield,
  User,
  Brain,
  Lightbulb,
  HelpCircle,
  Home,
  LogOut,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { FarcasterUI } from '@/components/FarcasterUI';
import { useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { useFarcaster } from '@/components/FarcasterProvider';
import { useMiniApp } from '@/hooks/useMiniApp';
import FarcasterUserProfile from '@/components/FarcasterUserProfile';
import { useAllMarketsApi } from '@/hooks/useMarketsApi';
import { useMarketEventsWithStore } from '@/stores/eventsStore';
import { useEventsStore } from '@/stores/eventsStore';
import { formatEther } from 'viem';
import NotificationContainer, { useNotifications } from '@/components/NotificationContainer';
import ReferralBanner from '@/components/ReferralBanner';
import { MiniAppProvider, useMiniApp as useMiniAppContext } from '@/contexts/MiniAppContext';
// Removed BottomNavigation - now using TopNavbar




const HomePageContent: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const [floatingElements, setFloatingElements] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    type: string;
  }>>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const { isConnected } = useAccount();
  const { isInFarcasterContext } = useFarcaster();
  const { isMiniApp, userFid, username, displayName, pfpUrl } = useMiniApp();
  const { allMarkets, stats, loading: marketsLoading, refetch } = useAllMarketsApi();
  const { logs, fetchAllLogs, isLoading: logsLoading } = useEventsStore();
  const { addNotification } = useNotifications();
  const { composeCast, triggerHaptic } = useMiniApp();

  // Connect market events to store
  useMarketEventsWithStore();

  // Helper function to get total volume directly from contract
  const getTotalVolumeFromContract = async () => {
    try {
      // This would require a direct contract call to get total volume
      // For now, we'll calculate from available data
      return 0n;
    } catch (error) {
      console.error('Error getting volume from contract:', error);
      return 0n;
    }
  };





  // Load events data when component mounts
  useEffect(() => {
    console.log('🔍 Homepage: Checking if events need to be fetched...', { logsLength: logs.length });
    if (logs.length === 0) {
      console.log('🔍 Homepage: Fetching all logs from deployment...');
      fetchAllLogs();
    }
  }, [logs.length, fetchAllLogs]);

  // Trigger event listener to check for new events on page load
  useEffect(() => {
    const triggerEventListener = async () => {
      try {
        console.log('🔄 Triggering event listener check...');
        console.log('✅ Event listener triggered successfully');
        
        // Also refresh market data to ensure UI is up to date
        refetch();
      } catch (error) {
        console.error('❌ Failed to trigger event listener:', error);
      }
    };

    // Trigger immediately on page load
    triggerEventListener();

    // Also trigger every 30 seconds for real-time updates
    const interval = setInterval(triggerEventListener, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Use stats from API, but add active traders calculation and improved volume calculation
  const enhancedStats = useMemo(() => {
    // Count unique active traders from events
    const uniqueTraders = new Set<string>();
    allMarkets.forEach(market => {
      if (market.creator && market.creator !== '0x0') {
        uniqueTraders.add(market.creator.toLowerCase());
      }
    });
    
    // Add traders from events if available
    const tradingEvents = logs.filter(log => 
      log.eventName === 'SharesBought' || 
      log.eventName === 'MarketCreated' ||
      log.eventName === 'WinningsClaimed'
    );

    tradingEvents.forEach(event => {
      const args = event.args || {};
      if (args.creator) uniqueTraders.add(args.creator.toLowerCase());
      if (args.buyer) uniqueTraders.add(args.buyer.toLowerCase());
      if (args.claimant) uniqueTraders.add(args.claimant.toLowerCase());
    });

    // Calculate volume from trading events as a backup/additional check
    let calculatedVolume = 0n;
    const sharesBoughtEvents = logs.filter(log => log.eventName === 'SharesBought');
    sharesBoughtEvents.forEach(event => {
      const args = event.args || {};
      if (args.amount) {
        calculatedVolume += BigInt(args.amount);
      }
    });

    // Use the higher of database-calculated volume or event-calculated volume
    const databaseVolume = BigInt(stats.totalVolume || '0');
    const finalVolume = calculatedVolume > databaseVolume ? calculatedVolume : databaseVolume;

    console.log('📊 Volume calculation debug:', {
      databaseVolume: databaseVolume.toString(),
      calculatedVolume: calculatedVolume.toString(),
      finalVolume: finalVolume.toString(),
      sharesBoughtEventsCount: sharesBoughtEvents.length,
      allMarketsCount: allMarkets.length
    });

    return {
      ...stats,
      activeTraders: uniqueTraders.size,
      totalVolume: finalVolume
    };
  }, [stats, allMarkets, logs]);

  // Get trending markets (most active)
  const getTrendingMarkets = () => {
    const currentTime = Math.floor(Date.now() / 1000);
    return allMarkets
      .filter((m) => m.status === 0 && Number(m.endtime) > currentTime) // Only active markets
      .sort((a, b) => Number(b.totalpool) - Number(a.totalpool))
      .slice(0, 3);
  };

  useEffect(() => {
    setIsLoaded(true);
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Mouse tracking for parallax (disabled on mobile)
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile) {
        setMousePosition({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    

    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

      // Action bar is always visible, no need for auto-open logic

  useEffect(() => {
    // Call sdk.actions.ready() to hide Farcaster Mini App splash screen
    const callReady = async () => {
      try {
        await sdk.actions.ready();
        console.log('Farcaster Mini App ready() called successfully on main page');
      } catch (error) {
        console.error('Error calling sdk.actions.ready():', error);
      }
    };
    
    callReady();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Referral Banner */}
      <ReferralBanner />
      
      {/* Hero Section - Mobile Optimized */}
      <div className="relative overflow-hidden min-h-screen flex items-center justify-center">
        <div className="relative px-3 sm:px-6 lg:px-8 text-center">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
            <img src="/logo.png" alt="Snarkels" className="w-12 h-12 md:w-20 md:h-20" />
            <h1 className="text-lg md:text-4xl font-bold text-gray-900 mb-3">
              Zyn Protocol
            </h1>
            <p className="text-xs md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Decentralized prediction markets on Celo - where your insights
              become rewards
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/markets"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
              >
                🚀 Start Trading Now
              </Link>
              <Link
                href="/create-market"
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-gray-200 text-sm"
              >
                📊 Create Market
              </Link>
            </div>

            {/* Stats Dashboard in Hero - Mobile Optimized */}
            <div className="grid grid-cols-2 md:grid-cols-4 mt-6 gap-3 mb-6 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/20">
                <div className="text-lg md:text-2xl font-bold text-blue-600 mb-1">
                  {marketsLoading ? '...' : enhancedStats.totalMarkets}
                </div>
                <p className="text-xs text-gray-700 font-medium">
                  Total Markets
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/20">
                <div className="text-lg md:text-2xl font-bold text-green-600 mb-1">
                  {marketsLoading ? '...' : enhancedStats.activeTraders}
                </div>
                <p className="text-xs text-gray-700 font-medium">
                  Active Traders
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/20">
                <div className="text-lg md:text-2xl font-bold text-purple-600 mb-1">
                  {marketsLoading ? '...' : (() => {
                    const volume = enhancedStats.totalVolume;
                    const volumeInCelo = formatEther(volume);
                    const roundedVolume = parseFloat(volumeInCelo).toFixed(0);
                    console.log('🔍 Volume display debug:', {
                      rawVolume: volume.toString(),
                      volumeInCelo: volumeInCelo,
                      roundedVolume: roundedVolume,
                      isBigInt: typeof volume === 'bigint'
                    });
                    return volume > 0n ? `${Number(roundedVolume)*10} CELO` : '0 CELO';
                  })()}
                </div>
                <p className="text-xs text-gray-700 font-medium">
                  {marketsLoading ? 'Loading...' : (enhancedStats.totalVolume > 0n ? 'Total Volume' : 'No Markets Yet')}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/20">
                <div className="text-lg md:text-2xl font-bold text-yellow-600 mb-1">
                  {marketsLoading ? '...' : enhancedStats.resolvedMarkets}
                </div>
                <p className="text-xs text-gray-700 font-medium">
                  Resolved markets
                </p>
              </div>
            </div>
          </div>
              </div>
            </div>

      {/* Trending Markets & Leaderboard - Mobile Optimized */}
      <div className="py-8 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Trending Markets */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  Trending Markets
                </h2>
                <Link
                  href="/markets"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View All →
                </Link>
              </div>
          {marketsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
                >
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getTrendingMarkets().map((market) => (
                <div
                  key={market.id.toString()}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                    {market.question}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {market.description}
                  </p>
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">YES:</span>
                      <span className="font-medium text-green-600">
                        {Number(market.totalyes) > 0 || Number(market.totalno) > 0
                          ? `${(
                              (Number(market.totalyes) /
                                (Number(market.totalyes) +
                                  Number(market.totalno))) *
                              100
                            ).toFixed(1)}%`
                          : "50.0%"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">NO:</span>
                      <span className="font-medium text-red-600">
                        {Number(market.totalyes) > 0 || Number(market.totalno) > 0
                          ? `${(
                              (Number(market.totalno) /
                                (Number(market.totalyes) +
                                  Number(market.totalno))) *
                              100
                            ).toFixed(1)}%`
                          : "50.0%"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span>Pool: {formatEther(BigInt(market.totalpool))} CELO</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {market.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/market/${market.id}`}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-center block text-xs"
                    >
                      View Market
                    </Link>
                    {isMiniApp && (
                      <button
                        onClick={async () => {
                          await triggerHaptic('light');
                          await composeCast(
                            `Check out this prediction market: "${market.question}" on @snarkels! 🚀`,
                            [`https://snarkels.lol/market/${market.id}`]
                          );
                        }}
                        className="bg-green-600 text-white py-2 px-2 rounded-lg hover:bg-green-700 transition-colors text-xs"
                        title="Share on Farcaster"
                      >
                        📢
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works - Mobile Optimized */}
      <div className="py-8 px-3 mb-6 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-center text-gray-900 mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Browse Markets
              </h3>
              <p className="text-sm text-gray-600">
                Find interesting prediction questions that match your expertise
              </p>
            </div>
              <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-green-600">2</span>
                </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Buy Shares
              </h3>
              <p className="text-sm text-gray-600">
                Invest in YES or NO outcomes based on your predictions
              </p>
                  </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-yellow-600">3</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Claim Winnings
              </h3>
              <p className="text-sm text-gray-600">
                Get rewarded when your predictions turn out to be correct
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with providers
export default function HomePage() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <FarcasterUI>
      <MiniAppProvider>
        <HomePageContent />
        <NotificationContainer 
          notifications={notifications} 
          onRemove={removeNotification} 
        />
      </MiniAppProvider>
    </FarcasterUI>
  );
}