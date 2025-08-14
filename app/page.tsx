'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Users, 
  Plus, 
  Sparkles, 
  Trophy, 
  Star, 
  TrendingUp,
  Clock,
  Gift,
  Gamepad2,
  ArrowDown,
  ExternalLink,
  ChevronUp,
  BookOpen,
  Award,
  Zap,
  Shield,
  Link as LinkIcon,
  User
} from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { FarcasterUI, FarcasterShareButton, FarcasterAddButton, FarcasterComposeButton } from '@/components/FarcasterUI';
import { FarcasterContextDisplay, FarcasterUserInfo } from '@/components/FarcasterContextDisplay';
import MiniAppHeader from '@/components/MiniAppHeader';
import MiniAppContextDisplay from '@/components/MiniAppContextDisplay';
import { useAccount } from 'wagmi';
import { useSession0Rewards } from '@/hooks/useSession0Rewards';
import { REWARD_TOKENS } from '@/lib/tokens-config';

// Quiz type definition
interface Quiz {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  participants: string;
  duration: string;
  reward: string;
  snarkelCode?: string; // For linking to actual quiz
  network?: string; // Optional network tag
}

// Featured Quiz Card Component
const FeaturedQuizCard = ({ quiz, index }: { quiz: Quiz; index: number }) => {
  const { isConnected } = useAccount();
  const [isHovered, setIsHovered] = useState(false);
  
  const difficultyColors = {
    Easy: 'text-green-600',
    Medium: 'text-yellow-600', 
    Hard: 'text-red-600'
  };

  const difficultyIcons = {
    Easy: '🟢',
    Medium: '🟡',
    Hard: '🔴'
  };

  return (
    <div 
      className={`relative transform transition-all duration-500 hover:scale-105 hover:rotate-1 cursor-pointer ${
        index === 0 ? 'rotate-1' : index === 1 ? '-rotate-1' : index === 2 ? 'rotate-2' : '-rotate-2'
      }`}
      style={{
        animationDelay: `${index * 200}ms`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pin effects */}
      <div className="absolute -top-2 -left-2 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full shadow-lg border-2 border-white z-20"></div>
      <div className="absolute -top-1 -left-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full z-20"></div>
      <div className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full shadow-lg border-2 border-white z-20"></div>
      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full z-20"></div>
      
      <div className="bg-white shadow-2xl rounded-2xl p-3 sm:p-4 relative overflow-hidden border-2 border-gray-200 hover:border-yellow-400 transition-all duration-300"
           style={{
             backgroundImage: `
               radial-gradient(circle at top right, rgba(252, 255, 82, 0.1) 0%, transparent 50%),
               linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)
             `
           }}>
        {/* Texture overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
             style={{
               backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
               backgroundSize: '8px 8px'
             }}></div>
        
        <div className="relative z-10">
          {/* Category tag */}
          <div className="inline-block bg-yellow-100 text-yellow-800 text-xs font-handwriting px-2 sm:px-3 py-1 rounded-full mb-2 border border-yellow-300">
            {quiz.category}
          </div>
          
          {/* Title */}
          <h3 className="font-handwriting text-base sm:text-lg mb-2 break-words" style={{ color: '#476520' }}>
            {quiz.title}
          </h3>
          
          {/* Description */}
          <p className="text-xs sm:text-sm mb-3 break-words" style={{ color: '#655947' }}>
            {quiz.description}
          </p>
          
          {/* Stats row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span style={{ color: '#655947' }}>{quiz.participants}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span style={{ color: '#655947' }}>{quiz.duration}</span>
            </div>
          </div>

          {/* Difficulty and Reward */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs sm:text-sm font-semibold ${difficultyColors[quiz.difficulty]}`}>
                {difficultyIcons[quiz.difficulty]} {quiz.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              <span className="text-xs sm:text-sm font-semibold" style={{ color: '#655947' }}>
                {quiz.reward}
            </span>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="flex gap-2">
            {isConnected ? (
              <Link
                href={`/quiz/${quiz.snarkelCode || quiz.id}`}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-1.5 px-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                <Play className="w-4 h-4 inline mr-2" />
                Play Now
            </Link>
          ) : (
              <div className="flex-1 bg-gray-300 text-gray-500 text-center py-1.5 px-3 rounded-lg font-semibold cursor-not-allowed">
                <User className="w-4 h-4 inline mr-2" />
                Connect to Play
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Session 0 Rewards Display Component
const Session0RewardsDisplay = () => {
  const { rewards, isLoading, error } = useSession0Rewards(process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS_BASE);
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-yellow-200 rounded animate-pulse"></div>
        <div className="h-4 bg-yellow-200 rounded animate-pulse w-3/4"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-600 text-sm font-handwriting">
        Error loading rewards: {error}
      </div>
    );
  }
  
  if (rewards.length === 0) {
    return (
      <div className="space-y-3 font-handwriting text-base" style={{ color: '#655947' }}>
        <div className="flex items-center gap-3 bg-white bg-opacity-70 p-3 rounded-lg">
          <Star className="w-5 h-5 text-yellow-500 animate-pulse" />
          <span>No rewards configured yet</span>
        </div>
        <div className="text-sm text-gray-500">
          Rewards will appear here once configured
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {rewards.map((reward, index) => {
        const tokenInfo = REWARD_TOKENS.find(t => t.address.toLowerCase() === reward.tokenAddress.toLowerCase());
        const amount = Number(reward.amount) / Math.pow(10, tokenInfo?.decimals || 18);
        
        return (
          <div key={index} className="flex items-center justify-between bg-white bg-opacity-70 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center">
                <span className="text-xs font-bold text-yellow-700">
                  {tokenInfo?.symbol?.charAt(0) || 'T'}
                </span>
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: '#476520' }}>
                  {tokenInfo?.symbol || 'Unknown'}
                </div>
                <div className="text-xs text-gray-500">
                  {tokenInfo?.network || 'Unknown Network'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm" style={{ color: '#476520' }}>
                {amount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {reward.isDistributed ? 'Distributed' : 'Available'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Supported Tokens Display Component
const SupportedTokensDisplay = () => {
  const { supportedTokens } = useSession0Rewards();
  
  return (
    <div className="space-y-2">
      {supportedTokens.slice(0, 6).map((token, index) => (
        <div key={index} className="flex items-center gap-2 bg-white bg-opacity-60 p-2 rounded-lg">
          <div className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-700">
              {token.symbol.charAt(0)}
            </span>
          </div>
          <span className="text-sm font-medium" style={{ color: '#476520' }}>
            {token.symbol}
          </span>
          <span className="text-xs text-gray-500 ml-auto">
            {token.network}
          </span>
        </div>
      ))}
      {supportedTokens.length > 6 && (
        <div className="text-center">
          <span className="text-xs text-gray-500 font-handwriting">
            +{supportedTokens.length - 6} more tokens supported
          </span>
        </div>
      )}
    </div>
  );
};

// Action Bar Component
const ActionBar = ({ isConnected }: { isConnected: boolean }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 border-t-2 border-yellow-400 rounded-t-2xl sm:rounded-t-3xl md:left-1/2 md:transform md:-translate-x-1/2 md:w-3/5"
         style={{
           backgroundImage: `
             radial-gradient(circle at top right, rgba(252, 255, 82, 0.1) 0%, transparent 50%),
             linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)
           `
         }}>
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
           style={{
             backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
             backgroundSize: '8px 8px'
           }}></div>
      
      <div className="relative z-10 p-2 sm:p-3 md:p-4">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-4">
          {/* Join a Snarkel */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-0 bg-green-300 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
            <Link href="/join" className="relative block">
              <button className="w-full px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-xl sm:rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 shadow-xl">
                <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="truncate">
                  JOIN A SNARKEL
                  </span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </Link>
          </div>
          
          {/* Host a Snarkel */}
          <div className="relative flex-1 min-w-0">
            <Link href="/create">
              <div className="bg-white shadow-lg rounded-xl sm:rounded-2xl p-1.5 sm:p-2 md:p-3 transform hover:scale-105 transition-all duration-300 border-2 border-yellow-400 relative overflow-hidden">
                <span className="font-handwriting text-xs sm:text-sm md:text-base text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 sm:gap-2 relative z-10 truncate" 
                      style={{ color: '#476520' }}>
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">Host a Snarkel</span>
                  <span className="sm:hidden">Host</span>
                </span>
              </div>
            </Link>
          </div>
          
          {/* Profile */}
          <div className="relative flex-1 min-w-0">
            <Link href="/profile">
              <div className="bg-white shadow-lg rounded-xl sm:rounded-2xl p-1.5 sm:p-2 md:p-3 transform hover:scale-105 transition-all duration-300 border-2 border-purple-400 relative overflow-hidden">
                <span className="font-handwriting text-xs sm:text-sm md:text-base text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 sm:gap-2 relative z-10 truncate" 
                      style={{ color: '#476520' }}>
                  <User className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">Profile</span>
                  <span className="sm:hidden">Profile</span>
                </span>
              </div>
            </Link>
          </div>
          
          {/* Wallet Connect */}
          <div className="flex-shrink-0">
            <WalletConnectButton compact={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
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
  // Action bar is always visible, no need for open/close state
  const [featuredQuizzes, setFeaturedQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const { isConnected } = useAccount();
  const quizCarouselRef = useRef<HTMLDivElement>(null);

  // Contract addresses - Base and Celo mainnet
  const CELO_CONTRACT = process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS_CELO||'';
  const BASE_CONTRACT = process.env.NEXT_PUBLIC_SNARKEL_CONTRACT_ADDRESS_BASE||'';

  const formatAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Scroll to specific quiz position
  const scrollToQuiz = (index: number) => {
    if (quizCarouselRef.current) {
      const quizWidth = 288; // w-72 = 288px
      const gap = 16; // gap-4 = 16px
      const scrollPosition = index * (quizWidth + gap);
      
      quizCarouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      
      setCurrentQuizIndex(index);
    }
  };

  // Handle scroll events to update current index
  const handleScroll = () => {
    if (quizCarouselRef.current) {
      const scrollLeft = quizCarouselRef.current.scrollLeft;
      const quizWidth = 288; // w-72 = 288px
      const gap = 16; // gap-4 = 16px
      const index = Math.round(scrollLeft / (quizWidth + gap));
      setCurrentQuizIndex(Math.max(0, Math.min(index, featuredQuizzes.length - 1)));
    }
  };

  // Fetch featured quizzes from API
  const fetchFeaturedQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      setQuizError(null);
      
      const response = await fetch('/api/snarkel/featured?limit=4');
      const data = await response.json();
      
      if (data.featuredSnarkels) {
        // Transform API data to match our Quiz interface
        const transformedQuizzes: Quiz[] = data.featuredSnarkels.map((snarkel: any) => ({
          id: parseInt(snarkel.id.replace(/\D/g, '') || '0'), // Extract numeric ID
          title: snarkel.title,
          description: snarkel.description,
          category: snarkel.category || 'Quiz',
          difficulty: snarkel.difficulty as 'Easy' | 'Medium' | 'Hard',
          participants: snarkel.formattedParticipants || '0',
          duration: snarkel.duration || '5 min',
          reward: snarkel.reward?.amount || '0',
          snarkelCode: snarkel.snarkelCode,
          network: (() => {
            const chainId = snarkel.rewards?.chainId || snarkel.reward?.chainId;
            if (chainId === 42220) return 'Celo';
            if (chainId === 8453) return 'Base';
            if (chainId === 44787) return 'Celo Alfajores';
            if (chainId === 84532 || chainId === 84531) return 'Base Sepolia';
            return undefined;
          })()
        }));
        
        setFeaturedQuizzes(transformedQuizzes);
      } else {
        setQuizError('No featured quizzes available');
      }
    } catch (error) {
      console.error('Error fetching featured quizzes:', error);
      setQuizError('Failed to load featured quizzes');
    } finally {
      setLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    setIsLoaded(true);
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Create floating game elements
    const elements = Array.from({ length: isMobile ? 6 : 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 70 + 15, // Keep more away from edges
      y: Math.random() * 70 + 15,
      size: Math.random() * (isMobile ? 15 : 25) + 10,
      delay: Math.random() * 3000,
      duration: Math.random() * 3000 + 4000,
      type: ['star', 'circle', 'triangle'][Math.floor(Math.random() * 3)],
    }));
    setFloatingElements(elements);

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
    
    // Fetch featured quizzes
    fetchFeaturedQuizzes();
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

      // Action bar is always visible, no need for auto-open logic

  return (
    <FarcasterUI>
      <div className="min-h-screen overflow-hidden relative">
        {/* Farcaster Context Display */}
        <FarcasterContextDisplay />
        
        {/* Mini App Context Display - Shows Mini App info when running as Mini App */}
        <MiniAppContextDisplay />
        
        {/* Mini App Header - Shows social context when running as Mini App */}
        <MiniAppHeader />
        
        {/* Enhanced textured background */}
        <div className="fixed inset-0 opacity-40 pointer-events-none">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  transparent,
                  transparent 24px,
                  #E7E3D4 24px,
                  #E7E3D4 26px
                ),
                radial-gradient(circle at 20% 80%, rgba(252, 255, 82, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(86, 223, 124, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse 200px 100px at center, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255, 255, 255, 0.03) 1deg, transparent 2deg)
              `,
              backgroundSize: '100% 26px, 600px 600px, 800px 800px, 400px 200px, 60px 60px',
              filter: 'contrast(1.1) brightness(0.98)'
            }}
          />
          {/* Paper texture overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0),
                repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
              `,
              backgroundSize: '20px 20px, 30px 30px'
            }}
          />
        </div>

        {/* Floating elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {floatingElements.map((element) => (
            <div
              key={element.id}
              className={`absolute opacity-10 animate-float-complex transition-transform duration-1000 ease-out`}
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.size}px`,
                height: `${element.size}px`,
                transform: isMobile ? 'none' : `translate(${(mousePosition.x - 50) * 0.02}px, ${(mousePosition.y - 50) * 0.02}px) rotate(${element.id * 30}deg)`,
                animationDelay: `${element.delay}ms`,
                animationDuration: `${element.duration}ms`,
              }}
            >
              {element.type === 'star' && <Star className="w-full h-full text-yellow-400" />}
              {element.type === 'circle' && <div className="w-full h-full rounded-full bg-green-400" />}
              {element.type === 'triangle' && <Trophy className="w-full h-full text-blue-400" />}
            </div>
          ))}
        </div>

        {/* Mobile Layout */}
        {isMobile ? (
          <div className="relative z-10 min-h-screen p-4 sm:p-6 pb-28 flex flex-col overflow-x-hidden">
            
            {/* Mobile Header */}
            <div className={`text-center mb-6 sm:mb-8 transition-all duration-1500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-white shadow-2xl rounded-3xl p-4 sm:p-6 relative overflow-hidden mx-auto max-w-sm" 
                   style={{
                     backgroundImage: `
                       radial-gradient(circle at top right, rgba(252, 255, 82, 0.1) 0%, transparent 50%),
                       linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)
                     `
                   }}>
                {/* Texture overlay for card */}
                <div className="absolute inset-0 opacity-30 pointer-events-none"
                     style={{
                       backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
                       backgroundSize: '8px 8px'
                     }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce-slow flex-shrink-0" style={{ color: '#476520' }} />
                    <h1 className="font-handwriting text-3xl sm:text-4xl truncate" style={{ color: '#476520' }}>
                      Snarkels
                    </h1>
                  </div>
                  <p className="font-handwriting text-base sm:text-lg px-2" style={{ color: '#655947' }}>
                    Knowledge meets web3 rewards
                  </p>
                </div>
              </div>
            </div>

            {/* Featured Quizzes Section */}
            <div className={`flex-1 transition-all duration-1500 delay-300 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>
              {/* Section Header */}
              <div className="text-center mb-4 sm:mb-6 px-2">
                <h2 className="font-handwriting text-2xl sm:text-3xl mb-2" style={{ color: '#476520' }}>
                  Featured Quizzes
                </h2>
                <div className="flex justify-center items-center gap-2 text-xs sm:text-sm" style={{ color: '#655947' }}>
                  <span>Swipe to explore all quizzes</span>
                  <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 animate-bounce" />
                </div>
              </div>
              
              {/* Quiz Cards with Horizontal Scrolling */}
              <div className="px-2">
            {loadingQuizzes ? (
              // Loading state
                  <div className="space-y-4 sm:space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white shadow-2xl rounded-2xl p-4 sm:p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-3 sm:mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-3 sm:mb-4 w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : quizError ? (
              // Error state
                  <div className="text-center py-6 sm:py-8 px-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 sm:p-6">
                      <p className="font-handwriting text-base sm:text-lg" style={{ color: '#655947' }}>
                    {quizError}
                  </p>
                  <button 
                    onClick={fetchFeaturedQuizzes}
                        className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm sm:text-base"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : featuredQuizzes.length === 0 ? (
              // Empty state
                  <div className="text-center py-6 sm:py-8 px-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6">
                      <p className="font-handwriting text-base sm:text-lg" style={{ color: '#655947' }}>
                    No featured quizzes available yet
                  </p>
                      <p className="text-xs sm:text-sm mt-2" style={{ color: '#655947' }}>
                    Check back soon for new challenges!
                  </p>
                </div>
              </div>
            ) : (
                  // Quiz cards with horizontal scrolling
                  <div className="relative">
                    {/* Scrollable container */}
                    <div 
                      className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide quiz-carousel snap-x snap-mandatory"
                      style={{
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onScroll={handleScroll}
                      ref={quizCarouselRef}
                    >
                      {featuredQuizzes.map((quiz, index) => (
                        <div 
                          key={quiz.id} 
                          className="flex-shrink-0 w-52 sm:w-58 md:w-70 snap-start"
                        >
                          <FeaturedQuizCard quiz={quiz} index={index} />
                        </div>
                      ))}
                    </div>
                    
                    {/* Navigation indicators */}
                    {featuredQuizzes.length > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-4">
                        {featuredQuizzes.map((_, index) => (
                          <div
                            key={index}
                            className="w-2 h-2 rounded-full bg-gray-300 transition-colors duration-200 cursor-pointer hover:bg-gray-400"
                            style={{
                              backgroundColor: index === currentQuizIndex ? '#476520' : '#D1D5DB'
                            }}
                            onClick={() => scrollToQuiz(index)}
                            onMouseEnter={() => scrollToQuiz(index)}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Scroll hint for mobile */}
                    {featuredQuizzes.length > 1 && (
                      <div className="text-center mt-2">
                        <p className="text-xs text-gray-500 font-handwriting">
                          {featuredQuizzes.length} quizzes available • Swipe to explore
                        </p>
                        <div className="flex justify-center items-center gap-1 mt-1">
                          <span className="text-xs text-gray-400">←</span>
                          <span className="text-xs text-gray-400">→</span>
                        </div>
                      </div>
                    )}
                  </div>
            )}
          </div>
            </div>

            {/* Mobile Status */}
            <div className={`text-center mt-6 sm:mt-8 transition-all duration-1500 delay-500 px-2 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-gradient-to-r from-green-50 to-emerald-100 shadow-lg rounded-2xl p-3 sm:p-4 relative overflow-hidden border border-green-200 mx-auto max-w-sm"
                   style={{
                     backgroundImage: `radial-gradient(circle at center, rgba(86, 223, 124, 0.1) 0%, transparent 50%)`
                   }}>
                <div className="flex flex-col items-center gap-2 sm:gap-3 font-handwriting text-base sm:text-lg" style={{ color: '#476520' }}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-3 h-3 rounded-full animate-pulse bg-green-400 shadow-lg flex-shrink-0"></div>
                    <span className="font-bold">LIVE</span>
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 animate-bounce flex-shrink-0" />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-300 whitespace-nowrap">
                      Base
                    </span>
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-300 whitespace-nowrap">
                      Celo
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs mt-1">
                    <a href={`https://basescan.org/address/${BASE_CONTRACT}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 underline truncate">
                      <LinkIcon className="w-3 h-3 flex-shrink-0" /> {formatAddr(BASE_CONTRACT)}
                    </a>
                    <a href={`https://celoscan.io/address/${CELO_CONTRACT}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-green-700 underline truncate">
                      <LinkIcon className="w-3 h-3 flex-shrink-0" /> {formatAddr(CELO_CONTRACT)}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Session 0 Rewards */}
            <div className={`text-center mt-4 sm:mt-6 transition-all duration-1500 delay-600 px-2 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-gradient-to-r from-yellow-50 to-amber-100 shadow-lg rounded-2xl p-3 sm:p-4 relative overflow-hidden border border-yellow-200 mx-auto max-w-sm"
                   style={{
                     backgroundImage: `radial-gradient(circle at center, rgba(252, 255, 82, 0.1) 0%, transparent 50%)`
                   }}>
                <div className="text-center mb-3">
                  <h4 className="font-handwriting text-lg font-bold" style={{ color: '#476520' }}>Session 0 Rewards</h4>
                </div>
                
                {/* Session 0 Rewards Display */}
                <Session0RewardsDisplay />
                
                {/* Supported Tokens */}
                <div className="mt-4">
                  <h5 className="font-handwriting text-sm mb-2" style={{ color: '#476520' }}>Supported Tokens</h5>
                  <SupportedTokensDisplay />
                </div>
              </div>
            </div>
            
            {/* Action Bar */}
            <ActionBar isConnected={isConnected} />
          </div>
        ) : (
          /* Desktop Layout */
          <div className="relative z-10 min-h-screen p-8 lg:p-16 pb-24">
            {/* Desktop Header - positioned to avoid overlap */}
            <div className={`absolute top-8 left-8 lg:top-16 lg:left-20 max-w-md transition-all duration-1500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-white shadow-2xl rounded-3xl p-8 transform -rotate-1 hover:rotate-0 transition-all duration-500 relative border-l-4 border-yellow-400 overflow-hidden"
                   style={{
                     backgroundImage: `
                       radial-gradient(circle at top right, rgba(252, 255, 82, 0.1) 0%, transparent 50%),
                       linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)
                     `
                   }}>
                {/* Pin effect */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full shadow-lg border-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full"></div>
                
                {/* Texture overlay */}
                <div className="absolute inset-0 opacity-30 pointer-events-none"
                     style={{
                       backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
                       backgroundSize: '12px 12px'
                     }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <Gamepad2 className="w-16 h-16 animate-bounce-slow" style={{ color: '#476520' }} />
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping" 
                           style={{ backgroundColor: '#FCFF52' }}></div>
                    </div>
                    
                    <div>
                      <h1 className="font-handwriting text-5xl lg:text-6xl mb-3 transform hover:scale-105 transition-transform duration-500" 
                          style={{ color: '#476520' }}>
                        Snarkels
                      </h1>
                      <p className="font-handwriting text-lg lg:text-xl max-w-sm" 
                         style={{ color: '#655947' }}>
                        ~ where knowledge meets web3 rewards ~
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Featured Quizzes Section */}
            <div className={`absolute top-8 right-8 lg:top-16 lg:right-20 max-w-md transition-all duration-1500 delay-300 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-white shadow-2xl rounded-3xl p-6 lg:p-8 transform rotate-1 hover:rotate-0 transition-all duration-500 relative border-l-4 border-blue-400 overflow-hidden">
                {/* Pin effect */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full shadow-lg border-2 border-white"></div>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 rounded-full"></div>
                
                {/* Texture overlay */}
                <div className="absolute inset-0 opacity-25 pointer-events-none"
                     style={{
                       backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
                       backgroundSize: '10px 10px'
                     }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <Trophy className="w-8 lg:w-10 h-8 lg:h-10 text-blue-600 animate-spin-slow" />
                    <h3 className="font-handwriting text-2xl lg:text-3xl" style={{ color: '#476520' }}>Featured Quizzes</h3>
                    </div>
                  <div className="space-y-3 font-handwriting text-base lg:text-lg" style={{ color: '#655947' }}>
                    <div className="flex items-center gap-3 bg-white bg-opacity-70 p-3 rounded-lg hover:scale-105 transition-transform">
                      <Zap className="w-5 lg:w-6 h-5 lg:h-6 text-blue-500 animate-pulse" />
                      <span>Join real-time battles</span>
                    </div>
                    <div className="flex items-center gap-4 hover:scale-105 transition-transform bg-white bg-opacity-60 p-3 rounded-lg">
                      <span className="text-2xl lg:text-3xl animate-spin-slow">⚡</span>
                      <span>Speed = more points!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rewards section - positioned to avoid overlap */}
            <div className={`absolute bottom-8 lg:bottom-20 left-8 lg:left-16 max-w-sm transition-all duration-1500 delay-500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 shadow-2xl rounded-3xl p-6 lg:p-8 transform -rotate-1 hover:rotate-1 transition-all duration-500 relative border-l-4 border-yellow-500 overflow-hidden">
                {/* Pin effect */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full shadow-lg border-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-600 rounded-full"></div>
                
                {/* Texture overlay */}
                <div className="absolute inset-0 opacity-25 pointer-events-none"
                     style={{
                       backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
                       backgroundSize: '10px 10px'
                     }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <Trophy className="w-8 lg:w-10 h-8 lg:h-10 text-yellow-600 animate-spin-slow" />
                    <h3 className="font-handwriting text-2xl lg:text-3xl" style={{ color: '#476520' }}>Session 0 Rewards</h3>
                  </div>
                  
                  {/* Session 0 Rewards Display */}
                  <Session0RewardsDisplay />
                  
                  {/* Supported Tokens */}
                  <div className="mt-6">
                    <h4 className="font-handwriting text-lg mb-3" style={{ color: '#476520' }}>Supported Tokens</h4>
                    <SupportedTokensDisplay />
                    </div>
                </div>
              </div>
            </div>

            {/* Status indicator - positioned to avoid overlap */}
            <div className={`absolute bottom-8 lg:bottom-16 right-8 lg:right-20 transition-all duration-1500 delay-1100 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 shadow-2xl rounded-3xl p-6 transform -rotate-1 hover:rotate-1 transition-all duration-500 relative border-l-4 border-green-400 overflow-hidden">
                {/* Pin effect */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full shadow-lg border-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full"></div>
                
                {/* Texture overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                     style={{
                       backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
                       backgroundSize: '8px 8px'
                     }}></div>
                
                <div className="relative z-10">
                  <div className="flex flex-col items-center gap-3 font-handwriting text-base lg:text-lg" style={{ color: '#476520' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 lg:w-4 h-3 lg:h-4 rounded-full animate-pulse bg-green-400 shadow-lg"></div>
                      <span className="font-bold">LIVE</span>
                      <Sparkles className="w-6 lg:w-8 h-6 lg:h-8 text-yellow-500 animate-bounce" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-300 text-sm">Base</span>
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-300 text-sm">Celo</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <a href={`https://basescan.org/address/${BASE_CONTRACT}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 underline">
                        <LinkIcon className="w-3 h-3" /> {formatAddr(BASE_CONTRACT)}
                      </a>
                      <a href={`https://celoscan.io/address/${CELO_CONTRACT}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-green-700 underline">
                        <LinkIcon className="w-3 h-3" /> {formatAddr(CELO_CONTRACT)}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Bar */}
            <ActionBar isConnected={isConnected} />
          </div>
        )}
      </div>
    </FarcasterUI>
  );
}