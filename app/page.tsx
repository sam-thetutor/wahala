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
  HelpCircle,
  Home
} from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { FarcasterUI } from '@/components/FarcasterUI';
import { useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';


// Action Bar Component
const ActionBar = ({ isConnected }: { isConnected: boolean }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 via-blue-700 to-slate-600 shadow-2xl z-50 border-t-2 border-blue-400 rounded-t-3xl md:left-1/2 md:transform md:-translate-x-1/2 md:w-4/5 lg:w-3/5">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
      </div>
      
      <div className="relative z-10 p-4 sm:p-5">
        <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-6">
          {/* Join a Snarkel */}
          <div className="relative flex-1 min-w-0">
            <Link href="/join">
              <div className="group bg-white shadow-lg hover:shadow-xl rounded-2xl p-3 sm:p-4 transform hover:scale-105 transition-all duration-300 border-2 border-blue-400 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="font-handwriting text-sm sm:text-base lg:text-lg text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 sm:gap-3 relative z-10 truncate text-blue-700 font-semibold">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded-full border-2 border-blue-400 bg-blue-100 flex-shrink-0 group-hover:bg-blue-200 transition-colors"></div>
                  <span className="hidden sm:inline">Join a Snarkel</span>
                  <span className="sm:hidden">Join</span>
                </span>
              </div>
            </Link>
          </div>
          
          {/* Host a Snarkel */}
          <div className="relative flex-1 min-w-0">
            <Link href="/create">
              <div className="group bg-white shadow-lg hover:shadow-xl rounded-2xl p-3 sm:p-4 transform hover:scale-105 transition-all duration-300 border-2 border-blue-400 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="font-handwriting text-sm sm:text-base lg:text-lg text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 sm:gap-3 relative z-10 truncate text-blue-700 font-semibold">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                  <span className="hidden sm:inline">Create Snarkel</span>
                  <span className="sm:hidden">Create</span>
                </span>
              </div>
            </Link>
          </div>
          
          {/* Profile */}
          <div className="relative flex-1 min-w-0">
            <Link href="/profile">
              <div className="group bg-white shadow-lg hover:shadow-xl rounded-2xl p-3 sm:p-4 transform hover:scale-105 transition-all duration-300 border-2 border-blue-400 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="font-handwriting text-sm sm:text-base lg:text-lg text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 sm:gap-3 relative z-10 truncate text-blue-700 font-semibold">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
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

  const { isConnected } = useAccount();

  // Contract addresses - Base and Celo mainnet
  const CELO_CONTRACT = '0x8b8fb708758dc8185ef31e685305c1aa0827ea65';
  const BASE_CONTRACT = '0xd2c5d1cf9727da34bcb6465890e4fb5c413bbd40';

  const formatAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;



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
            {/* Mobile Navigation Bar */}
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-handwriting text-xl font-bold text-blue-900">Snarkels</h1>
                  <p className="text-xs text-gray-600 -mt-1">Interactive Quizzes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/create"
                  className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-300 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  title="Create Quiz"
                >
                  <Plus className="w-4 h-4" />
                </Link>
                <Link
                  href="/admin"
                  className="p-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl transition-all duration-300 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                  title="My Quizzes"
                >
                  <Trophy className="w-4 h-4" />
                </Link>
                <WalletConnectButton />
              </div>
            </div>
            
            {/* Mobile Header */}
            <div className={`text-center mb-8 sm:mb-10 transition-all duration-1500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-slate-600 shadow-2xl rounded-3xl p-6 sm:p-8 relative overflow-hidden mx-auto max-w-md text-white">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-4 sm:gap-5 mb-4 sm:mb-5">
                    <div className="relative">
                      <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16 animate-bounce-slow flex-shrink-0 text-blue-100" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping bg-yellow-400"></div>
                    </div>
                    <h1 className="font-handwriting text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">
                      Snarkels
                    </h1>
                  </div>
                  <p className="font-handwriting text-lg sm:text-xl px-2 text-blue-100 font-medium">
                    Interactive Web3 Quizzes
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-200">
                    <span>🎯</span>
                    <span>Learn & Earn</span>
                    <span>🚀</span>
                  </div>
                </div>
              </div>
            </div>

                        {/* Featured Snarkels Section */}
            <div className={`flex-1 transition-all duration-1500 delay-300 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>
              {/* Section Header */}
              <div className="text-center mb-6 sm:mb-8 px-2">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <h2 className="font-handwriting text-3xl sm:text-4xl font-bold text-blue-900 mb-3">
                  Featured Snarkels
                </h2>
                <p className="text-gray-600 text-sm sm:text-base mb-4 max-w-md mx-auto">
                  Discover amazing challenges and test your knowledge
                </p>
              </div>
              
              {/* Explore Button */}
              <div className="text-center px-2">
                <Link
                  href="/featured"
                  className="group inline-flex items-center gap-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-8 py-6 rounded-3xl font-bold text-xl transition-all duration-500 transform hover:-translate-y-2 shadow-2xl hover:shadow-3xl border-2 border-white/20 hover:border-white/40"
                >
                  <div className="relative">
                    <Star className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                  <span>Explore Featured Snarkels</span>
                  <div className="relative">
                    <Trophy className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  </div>
                </Link>
                
                {/* Decorative elements */}
                <div className="mt-6 flex justify-center items-center gap-4">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-red-500 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                </div>
                
                <p className="text-gray-500 text-sm mt-4">
                  Browse curated Snarkels by category, difficulty, and more
                </p>
              </div>
            </div>
            
            {/* Action Bar */}
            <ActionBar isConnected={isConnected} />
          </div>
        ) : (
          /* Desktop Layout */
          <div className="relative z-10 min-h-screen p-8 lg:p-16 pb-24">
            {/* Desktop Navigation Bar - Top Right */}
            <div className="absolute top-8 right-8 lg:top-16 lg:right-16 z-50 flex items-center gap-4">
              <Link
                href="/create"
                className="group p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-300 text-white hover:scale-105 transform shadow-lg hover:shadow-xl"
                title="Create Quiz"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </Link>
              <Link
                href="/admin"
                className="group p-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl transition-all duration-300 text-white hover:scale-105 transform shadow-lg hover:shadow-xl"
                title="My Quizzes"
              >
                <Trophy className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </Link>
              <WalletConnectButton />
            </div>

            {/* Desktop Header - positioned to avoid overlap */}
            <div className={`absolute top-8 left-8 lg:top-16 lg:left-20 max-w-lg transition-all duration-1500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-slate-600 shadow-2xl rounded-3xl p-8 lg:p-10 transform -rotate-1 hover:rotate-0 transition-all duration-500 relative border-l-4 border-blue-400 overflow-hidden text-white">
                {/* Pin effects */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full shadow-lg border-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-purple-500 rounded-full shadow-lg border-2 border-white"></div>
                
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-12 translate-y-12"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-6 lg:gap-8">
                    <div className="relative">
                      <Gamepad2 className="w-16 h-16 lg:w-20 lg:h-20 animate-bounce-slow text-blue-100" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full animate-ping bg-yellow-400"></div>
                    </div>
                    
                    <div>
                      <h1 className="font-handwriting text-5xl lg:text-6xl xl:text-7xl mb-3 transform hover:scale-105 transition-transform duration-500 text-white font-bold drop-shadow-lg">
                        Snarkels
                      </h1>
                      <p className="font-handwriting text-lg lg:text-xl xl:text-2xl max-w-sm text-blue-100 font-medium">
                        Interactive Web3 Quizzes
                      </p>
                      <div className="mt-4 flex items-center gap-3 text-sm text-blue-200">
                        <span>🎯</span>
                        <span>Learn & Earn</span>
                        <span>🚀</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Snarkels Section - Center */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1500 delay-700 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <h2 className="font-handwriting text-4xl lg:text-5xl xl:text-6xl font-bold text-blue-900 mb-4">
                  Featured Snarkels
                </h2>
                <p className="text-gray-600 text-lg lg:text-xl mb-6 max-w-2xl mx-auto">
                  Discover amazing challenges and test your knowledge with our curated selection
                </p>
              </div>
              
              {/* Explore Button */}
              <div className="text-center">
                <Link
                  href="/featured"
                  className="group inline-flex items-center gap-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-12 py-8 rounded-3xl font-bold text-2xl lg:text-3xl transition-all duration-500 transform hover:-translate-y-3 shadow-2xl hover:shadow-3xl border-2 border-white/20 hover:border-white/40"
                >
                  <div className="relative">
                    <Star className="w-10 h-10 lg:w-12 lg:h-12 group-hover:rotate-12 transition-transform duration-300" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                  <span>Explore Featured Snarkels</span>
                  <div className="relative">
                    <Trophy className="w-10 h-10 lg:w-12 lg:h-12 group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  </div>
                </Link>
                
                {/* Decorative elements */}
                <div className="mt-8 flex justify-center items-center gap-6">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-4 h-4 bg-gradient-to-r from-pink-400 to-red-500 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                </div>
                
                <p className="text-gray-500 text-lg mt-6">
                  Browse curated Snarkels by category, difficulty, and more
                </p>
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