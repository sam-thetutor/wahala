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
      <div className="min-h-screen overflow-hidden relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)
              `,
              backgroundSize: '800px 800px, 600px 600px'
            }}
          />
        </div>

        {/* Floating elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {floatingElements.map((element) => (
            <div
              key={element.id}
              className="absolute pointer-events-none animate-float-quiz opacity-20"
              style={{
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${element.size}px`,
                height: `${element.size}px`,
                transform: isMobile ? 'none' : `translate(${(mousePosition.x - 50) * 0.01}px, ${(mousePosition.y - 50) * 0.01}px)`,
                animationDelay: `${element.delay}ms`,
                animationDuration: `${element.duration}ms`,
              }}
            >
              {element.type === 'brain' && <Brain className="w-full h-full text-blue-400" />}
              {element.type === 'lightbulb' && <Lightbulb className="w-full h-full text-amber-400" />}
              {element.type === 'question' && <HelpCircle className="w-full h-full text-indigo-400" />}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen p-4 sm:p-6 pb-28 flex flex-col">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
              <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="font-handwriting text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
              Snarkels
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-4">
              Interactive Web3 Quizzes
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-amber-500" />
                Learn & Earn
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-blue-500" />
                Play & Compete
              </span>
            </div>
          </div>

          {/* Hero CTA */}
          <div className="text-center mb-12">
            <Link
              href="/join"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-handwriting text-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Play className="w-6 h-6" />
              Play Now
            </Link>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
            {/* Create Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-handwriting text-lg font-bold text-gray-900 mb-2">Create</h3>
              <p className="text-gray-600 text-sm">Design your own Web3 quizzes</p>
            </div>

            {/* Join Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-handwriting text-lg font-bold text-gray-900 mb-2">Join</h3>
              <p className="text-gray-600 text-sm">Enter real-time quiz battles</p>
            </div>

            {/* Compete Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-handwriting text-lg font-bold text-gray-900 mb-2">Compete</h3>
              <p className="text-gray-600 text-sm">Faster answers = more points</p>
            </div>

            {/* Win Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-handwriting text-lg font-bold text-gray-900 mb-2">Win</h3>
              <p className="text-gray-600 text-sm">Climb leaderboards & earn rewards</p>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/create"
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-handwriting font-medium shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300"
            >
              <Plus className="w-5 h-5" />
              Create a Snarkel
            </Link>
            <Link
              href="/featured"
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-handwriting font-medium shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300"
            >
              <Star className="w-5 h-5" />
              Browse Featured
            </Link>
          </div>

          {/* Wallet Connection */}
          {!isConnected && (
            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 max-w-md mx-auto">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-handwriting text-lg font-bold text-gray-900 mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Join the Web3 quiz revolution
                </p>
                <WalletConnectButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </FarcasterUI>
  );
}