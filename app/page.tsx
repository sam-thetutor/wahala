'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Award,
  Zap,
  Shield,
  User,
  Brain,
  Lightbulb,
  HelpCircle
} from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { FarcasterUI } from '@/components/FarcasterUI';
import { useAccount } from 'wagmi';

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
    Easy: 'text-emerald-600',
    Medium: 'text-amber-600', 
    Hard: 'text-red-600'
  };

  const difficultyIcons = {
    Easy: '🟢',
    Medium: '🟡',
    Hard: '🔴'
  };

  return (
    <div 
      className="compact-quiz-card playful-hover bg-white rounded-3xl p-4 border border-blue-200 hover:border-blue-400 glassmorphism"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-semibold text-blue-900 mb-1 truncate">
            {quiz.title}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-gray-600 truncate mb-2">
            {quiz.description}
          </p>
          
          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 flex-shrink-0 text-blue-600" />
              <span>{quiz.participants}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0 text-blue-600" />
              <span>{quiz.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 flex-shrink-0 text-emerald-500" />
              <span className="font-medium">{quiz.reward}</span>
            </div>
            {/* Leaderboard link */}
            {quiz.snarkelCode && (
              <div className="flex items-center gap-1">
                <Link 
                  href={`/quiz/${quiz.snarkelCode}/leaderboard`}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                  <Trophy className="w-3 h-3" />
                  <span className="hidden sm:inline">Leaderboard</span>
                  <span className="sm:hidden">LB</span>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 ml-4">
          {/* Category tag */}
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            {quiz.category}
          </span>
          
          {/* Difficulty */}
          <div className="flex items-center gap-1">
            <span className="text-sm">{difficultyIcons[quiz.difficulty]}</span>
            <span className={`text-xs font-medium ${difficultyColors[quiz.difficulty]}`}>
              {quiz.difficulty}
            </span>
          </div>
          
          {/* Join button */}
          {quiz.snarkelCode ? (
            <Link href={`/join?code=${quiz.snarkelCode}`}>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 animate-pulse-blue">
                <span className="text-sm">
                  {isConnected ? 'Join' : 'Connect'}
                </span>
              </button>
            </Link>
          ) : (
            <button className="bg-gray-400 text-white px-4 py-2 rounded-xl cursor-not-allowed font-medium text-sm">
              Soon
            </button>
          )}
          
          
        </div>
      </div>
      
      {/* Network badge if available */}
      {quiz.network && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full border border-emerald-300">
            <Sparkles className="w-3 h-3 flex-shrink-0" /> {quiz.network}
          </span>
        </div>
      )}
    </div>
  );
};

// Action Bar Component
const ActionBar = ({ isConnected }: { isConnected: boolean }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-slate-500 shadow-2xl z-50 border-t-2 border-blue-500 rounded-t-3xl md:left-1/2 md:transform md:-translate-x-1/2 md:w-3/5">
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {/* Join a Snarkel */}
          <div className="relative flex-1 min-w-0">
            <Link href="/join">
              <div className="bg-white shadow-lg rounded-2xl p-2 sm:p-3 transform hover:scale-105 transition-all duration-300 border-2 border-blue-400 relative overflow-hidden">
                <span className="font-handwriting text-xs sm:text-sm md:text-base text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 sm:gap-2 relative z-10 truncate text-blue-700">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full border-2 border-blue-400 bg-blue-100 flex-shrink-0"></div>
                  <span className="hidden sm:inline">Join a Snarkel</span>
                  <span className="sm:hidden">Join</span>
                </span>
              </div>
            </Link>
          </div>
          
          {/* Host a Snarkel */}
          <div className="relative flex-1 min-w-0">
            <Link href="/create">
              <div className="bg-white shadow-lg rounded-2xl p-2 sm:p-3 transform hover:scale-105 transition-all duration-300 border-2 border-blue-400 relative overflow-hidden">
                <span className="font-handwriting text-xs sm:text-sm md:text-base text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 sm:gap-2 relative z-10 truncate text-blue-700">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Host a Snarkel</span>
                  <span className="sm:hidden">Host</span>
                </span>
              </div>
            </Link>
          </div>
          
          {/* Profile */}
          <div className="relative flex-1 min-w-0">
            <Link href="/profile">
              <div className="bg-white shadow-lg rounded-2xl p-2 sm:p-3 transform hover:scale-105 transition-all duration-300 border-2 border-blue-400 relative overflow-hidden">
                <span className="font-handwriting text-xs sm:text-sm md:text-base text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 sm:gap-2 relative z-10 truncate text-blue-700">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Profile</span>
                  <span className="sm:hidden">Profile</span>
                </span>
              </div>
            </Link>
          </div>
          
          {/* Wallet Connect */}
          <div className="flex-shrink-0">
            <WalletConnectButton />
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
  const { isConnected } = useAccount();

  // Contract addresses - Base and Celo mainnet
  const CELO_CONTRACT = '0x8b8fb708758dc8185ef31e685305c1aa0827ea65';
  const BASE_CONTRACT = '0xd2c5d1cf9727da34bcb6465890e4fb5c413bbd40';

  const formatAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

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

  // Initialize floating elements with quiz-related icons
  useEffect(() => {
    const elements = [
      { id: 1, x: 10, y: 20, size: 40, delay: 0, duration: 6000, type: 'brain' },
      { id: 2, x: 85, y: 15, size: 35, delay: 1000, duration: 7000, type: 'lightbulb' },
      { id: 3, x: 20, y: 80, size: 45, delay: 2000, duration: 8000, type: 'question' },
      { id: 4, x: 90, y: 75, size: 30, delay: 3000, duration: 5500, type: 'brain' },
      { id: 5, x: 50, y: 10, size: 25, delay: 4000, duration: 6500, type: 'lightbulb' },
      { id: 6, x: 70, y: 90, size: 40, delay: 5000, duration: 7500, type: 'question' }
    ];
    setFloatingElements(elements);
  }, []);

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
              className="absolute pointer-events-none animate-float-quiz"
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
              {element.type === 'brain' && <Brain className="w-full h-full text-blue-500" />}
              {element.type === 'lightbulb' && <Lightbulb className="w-full h-full text-amber-500" />}
              {element.type === 'question' && <HelpCircle className="w-full h-full text-purple-500" />}
            </div>
          ))}
        </div>

        {/* Mobile Layout */}
        {isMobile ? (
          <div className="relative z-10 min-h-screen p-4 sm:p-6 pb-28 flex flex-col overflow-x-hidden">
            {/* Mobile Wallet Connect Button - Top Right */}
            <div className="absolute top-4 right-4 z-50">
              <WalletConnectButton />
            </div>
            
            {/* Mobile Header */}
            <div className={`text-center mb-6 sm:mb-8 transition-all duration-1500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-gradient-to-r from-blue-600 to-slate-500 shadow-2xl rounded-3xl p-4 sm:p-6 relative overflow-hidden mx-auto max-w-sm text-white">
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce-slow flex-shrink-0 text-blue-100" />
                    <h1 className="font-handwriting text-3xl sm:text-4xl truncate text-white">
                      Snarkels
                    </h1>
                  </div>
                  <p className="font-handwriting text-base sm:text-lg px-2 text-slate-200">
                    Interactive Quizzes
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
                <h2 className="font-handwriting text-2xl sm:text-3xl mb-2 text-blue-900">
                  Featured Quizzes
                </h2>
                <div className="flex justify-center items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <span>Scroll to explore</span>
                  <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 animate-bounce text-blue-600" />
                </div>
              </div>
              
                        {/* Quiz Cards */}
              <div className="space-y-4 sm:space-y-6 px-2">
            {loadingQuizzes ? (
              // Loading state
                  <div className="space-y-4 sm:space-y-6">
                {[1, 2].map((i) => (
                      <div key={i} className="bg-white shadow-2xl rounded-3xl p-4 sm:p-6 animate-pulse border border-blue-200">
                        <div className="h-4 bg-blue-200 rounded mb-3 sm:mb-4"></div>
                    <div className="h-3 bg-blue-200 rounded mb-2"></div>
                        <div className="h-3 bg-blue-200 rounded mb-3 sm:mb-4 w-3/4"></div>
                    <div className="h-8 bg-blue-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : quizError ? (
              // Error state
                  <div className="text-center py-6 sm:py-8 px-2">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-6">
                      <p className="font-handwriting text-base sm:text-lg text-amber-800">
                    {quizError}
                  </p>
                  <button 
                    onClick={fetchFeaturedQuizzes}
                        className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : featuredQuizzes.length === 0 ? (
              // Empty state
                  <div className="text-center py-6 sm:py-8 px-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-6">
                      <p className="font-handwriting text-base sm:text-lg text-blue-800">
                    No featured quizzes available yet
                  </p>
                      <p className="text-xs sm:text-sm mt-2 text-blue-600">
                    Check back soon for new challenges!
                  </p>
                </div>
              </div>
            ) : (
              // Quiz cards
              featuredQuizzes.slice(0, 2).map((quiz, index) => (
                <FeaturedQuizCard key={quiz.id} quiz={quiz} index={index} />
              ))
            )}
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
              <div className="bg-gradient-to-r from-blue-600 to-slate-500 shadow-2xl rounded-3xl p-8 transform -rotate-1 hover:rotate-0 transition-all duration-500 relative border-l-4 border-blue-400 overflow-hidden text-white">
                {/* Pin effect */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full shadow-lg border-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <Gamepad2 className="w-16 h-16 animate-bounce-slow text-blue-100" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping bg-blue-200"></div>
                    </div>
                    
                    <div>
                      <h1 className="font-handwriting text-5xl lg:text-6xl mb-3 transform hover:scale-105 transition-transform duration-500 text-white">
                        Snarkels
                      </h1>
                      <p className="font-handwriting text-lg lg:text-xl max-w-sm text-slate-200">
                        ~ Interactive Quizzes ~
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Quizzes Section - Center */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1500 delay-700 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>
              <div className="text-center mb-8">
                <h2 className="font-handwriting text-4xl lg:text-5xl mb-4 text-blue-900">
                  Featured Quizzes
                </h2>
                <div className="flex justify-center items-center gap-2 text-lg text-gray-600">
                  <span className="font-handwriting">Discover amazing challenges</span>
                  <ArrowDown className="w-6 h-6 animate-bounce text-blue-600" />
                </div>
              </div>
              
              {/* Quiz Cards Grid */}
              <div className="grid grid-cols-2 gap-6 max-w-4xl">
                {loadingQuizzes ? (
                  // Loading state
                  <div className="col-span-2 grid grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white shadow-2xl rounded-3xl p-6 animate-pulse border border-blue-200">
                        <div className="h-4 bg-blue-200 rounded mb-4"></div>
                        <div className="h-3 bg-blue-200 rounded mb-2"></div>
                        <div className="h-3 bg-blue-200 rounded mb-4 w-3/4"></div>
                        <div className="h-8 bg-blue-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : quizError ? (
                  // Error state
                  <div className="col-span-2 text-center py-8">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                      <p className="font-handwriting text-lg text-amber-800">
                        {quizError}
                      </p>
                      <button 
                        onClick={fetchFeaturedQuizzes}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : featuredQuizzes.length === 0 ? (
                  // Empty state
                  <div className="col-span-2 text-center py-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                      <p className="font-handwriting text-lg text-blue-800">
                        No featured quizzes available yet
                      </p>
                      <p className="text-sm mt-2 text-blue-600">
                        Check back soon for new challenges!
                      </p>
                    </div>
                  </div>
                ) : (
                  // Quiz cards
                  featuredQuizzes.map((quiz, index) => (
                    <FeaturedQuizCard key={quiz.id} quiz={quiz} index={index} />
                  ))
                )}
              </div>
            </div>

            {/* What you can do - positioned to avoid overlap */}
            <div className={`absolute top-8 right-8 lg:top-20 lg:right-16 max-w-sm transition-all duration-1500 delay-300 ${
              isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}>
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-2xl rounded-3xl p-6 lg:p-8 transform -rotate-1 hover:-rotate-1 transition-all duration-500 relative border-l-4 border-slate-400 overflow-hidden">
                {/* Pin effect */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-500 rounded-full shadow-lg border-2 border-white"></div>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-slate-600 rounded-full"></div>
                
                <div className="relative z-10">
                  <h3 className="font-handwriting text-2xl lg:text-3xl mb-6 text-center text-slate-800">
                    What you can do:
                  </h3>
                  <div className="space-y-4 font-handwriting text-base lg:text-lg text-slate-700">
                    <div className="flex items-center gap-4 hover:scale-105 transition-transform bg-white bg-opacity-60 p-3 rounded-lg">
                      <span className="text-2xl lg:text-3xl animate-pulse">✏️</span>
                      <span>Create interactive quizzes</span>
                    </div>
                    <div className="flex items-center gap-4 hover:scale-105 transition-transform bg-white bg-opacity-60 p-3 rounded-lg">
                      <span className="text-2xl lg:text-3xl animate-bounce">🎮</span>
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
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-2xl rounded-3xl p-6 lg:p-8 transform -rotate-1 hover:rotate-1 transition-all duration-500 relative border-l-4 border-slate-500 overflow-hidden">
                {/* Pin effect */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-500 rounded-full shadow-lg border-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-slate-600 rounded-full"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <Trophy className="w-8 lg:w-10 h-8 lg:h-10 text-slate-600 animate-spin-slow" />
                    <h3 className="font-handwriting text-2xl lg:text-3xl text-slate-800">Earn Rewards!</h3>
                  </div>
                  <div className="space-y-3 font-handwriting text-base lg:text-lg text-slate-700">
                    <div className="flex items-center gap-3 bg-white bg-opacity-70 p-3 rounded-lg hover:scale-105 transition-transform">
                      <Zap className="w-5 lg:w-6 h-5 lg:h-6 text-slate-500 animate-pulse" />
                      <span>ERC20 tokens</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white bg-opacity-70 p-3 rounded-lg hover:scale-105 transition-transform">
                      <Star className="w-5 lg:w-6 h-5 lg:h-6 text-emerald-500 animate-pulse" />
                      <span>Speed bonuses</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white bg-opacity-70 p-3 rounded-lg hover:scale-105 transition-transform">
                      <Shield className="w-5 lg:w-6 h-5 lg:h-6 text-slate-500 animate-pulse" />
                      <span>Leaderboards</span>
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