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
  ArrowRight,
  Award,
  Zap,
  Shield,
  User,
  Brain,
  Lightbulb,
  HelpCircle,
  Home,
  LogOut
} from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { FarcasterUI } from '@/components/FarcasterUI';
import { useAccount, useDisconnect } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';


// Action Bar Component
const ActionBar = ({ isConnected, disconnect }: { isConnected: boolean; disconnect: () => void }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-100 via-blue-50 to-slate-100 shadow-2xl z-50 border-t-2 border-slate-300 rounded-t-3xl md:left-1/2 md:transform md:-translate-x-1/2 md:w-4/5 lg:w-3/5">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-200 rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-200 rounded-full translate-x-12 translate-y-12"></div>
      </div>
      
      <div className="relative z-10 p-4 sm:p-5">
        <div className="flex items-center justify-center gap-3 sm:gap-4 lg:gap-6">
          {/* Host a Snarkel - Hidden on mobile when wallet not connected */}
          <div className={`relative flex-1 min-w-0 ${!isConnected ? 'hidden md:block' : ''}`}>
            <Link href="/create">
              <div className="group bg-white shadow-lg hover:shadow-xl rounded-2xl p-3 sm:p-4 transform hover:scale-105 transition-all duration-300 border-2 border-slate-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="font-handwriting text-xs sm:text-base lg:text-lg text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 sm:gap-3 relative z-10 truncate text-slate-700 font-semibold">
                  <Plus className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-slate-600" />
                  <span className="hidden sm:inline">Create Snarkel</span>
                  <span className="sm:hidden">Create</span>
                </span>
              </div>
            </Link>
          </div>
          
          {/* Profile - Hidden on mobile when wallet not connected */}
          <div className={`relative flex-1 min-w-0 ${!isConnected ? 'hidden md:block' : ''}`}>
            <Link href="/profile">
              <div className="group bg-white shadow-lg hover:shadow-xl rounded-2xl p-3 sm:p-4 transform hover:scale-105 transition-all duration-300 border-2 border-slate-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="font-handwriting text-xs sm:text-base lg:text-lg text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 sm:gap-3 relative z-10 truncate text-slate-700 font-semibold">
                  <User className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-slate-600" />
                  <span className="hidden sm:inline">Profile</span>
                  <span className="sm:hidden">Profile</span>
                </span>
              </div>
            </Link>
          </div>
          
          {/* Wallet Connect - Only visible when not connected */}
          {!isConnected && (
            <div className="flex-shrink-0">
              <WalletConnectButton />
            </div>
          )}
          
          {/* Logout Button - Only visible when connected */}
          {isConnected && (
            <div className="flex-shrink-0">
              <button
                onClick={() => disconnect()}
                className="p-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-300 text-white hover:scale-105 transform shadow-lg hover:shadow-xl"
                title="Disconnect Wallet"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
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
  const { disconnect } = useDisconnect();

  // Contract addresses - Base and Celo mainnet
  const CELO_CONTRACT = '0x8b8fb708758dc8185ef31e685305c1aa0827ea65';
  const BASE_CONTRACT = '0xd2c5d1cf9727da34bcb6465890e4fb5c413bbd40';

  const formatAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;





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

            
            {/* Mobile Header */}


                        {/* Featured Snarkels Section */}
            <div className={`flex-1 flex flex-col items-center justify-center transition-all duration-1500 delay-300 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>
              {/* Logo above play button */}
              <div className="mb-8 text-center transform translate-x-5 translate-y-2">
                <div className="w-40 h-40 sm:w-48 sm:h-48">
                  <img 
                    src="/logo.png" 
                    alt="Snarkels Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              {/* Play Button */}
              <div className="text-center px-2">
                <Link
                  href="/join"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black text-lg text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-400/80 to-purple-500/80 hover:from-blue-300/90 hover:to-purple-400/90 overflow-hidden group"
                >
                  <span className="font-handwriting">Play a Snarkel</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                {/* Clickable reference text below button */}
                <Link href="/join" className="block mt-4">
                  <p className="text-gray-500 text-sm font-handwriting hover:text-blue-600 transition-colors cursor-pointer underline">
                    explore featured snarkels
                  </p>
                </Link>
              </div>
            </div>
            
            {/* Action Bar */}
            <ActionBar isConnected={isConnected} disconnect={disconnect} />
          </div>
        ) : (
          /* Desktop Layout */
          <div className="relative z-10 min-h-screen p-8 lg:p-16 pb-24">


            {/* Logo - Image in left upper */}
            <div className={`absolute top-8 left-8 lg:top-16 lg:left-16 transition-all duration-1500 delay-100 ${
              isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}>
              <div className="w-40 h-40 lg:w-80 lg:h-80 transform lg:translate-x-32">
                <img 
                  src="/logo.png" 
                  alt="Snarkels Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Featured Snarkels Section - Center */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1500 delay-700 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>

              
              {/* Play Button */}
              <div className="text-center">
                <Link
                  href="/join"
                  className="inline-flex items-center justify-center gap-3 px-12 py-4 rounded-xl font-black text-2xl text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-400/80 to-purple-500/80 hover:from-blue-300/90 hover:to-purple-400/90 overflow-hidden group"
                >
                  <span className="font-handwriting">Play a Snarkel</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                {/* Clickable reference text below button */}
                <Link href="/join" className="block mt-6">
                  <p className="text-gray-500 text-base font-handwriting hover:text-blue-600 transition-colors cursor-pointer underline">
                    explore featured snarkels
                  </p>
                </Link>
              </div>
            </div>



            {/* What you can do - positioned to avoid overlap */}
            <div className={`absolute top-32 right-8 lg:top-52 lg:right-16 max-w-sm transition-all duration-1500 delay-300 ${
              isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}>
              <div className="text-center">
                <h3 className="font-handwriting text-2xl lg:text-3xl mb-6 text-slate-800">
                  What you can do:
                </h3>
                <div className="space-y-4 font-handwriting text-base lg:text-lg text-slate-700">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl lg:text-3xl animate-pulse">✏️</span>
                    <span>Create interactive quizzes</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl lg:text-3xl animate-bounce">🎮</span>
                    <span>Join real-time battles</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl lg:text-3xl animate-spin-slow">⚡</span>
                    <span>Speed = more points!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rewards section - positioned to avoid overlap */}
            <div className={`absolute bottom-16 lg:bottom-32 left-8 lg:left-16 max-w-sm transition-all duration-1500 delay-500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="text-center">
                <div className="flex items-center gap-4 mb-6 justify-center">
                  <Trophy className="w-8 lg:w-10 h-8 lg:h-10 text-slate-600 animate-spin-slow" />
                  <h3 className="font-handwriting text-2xl lg:text-3xl text-slate-800">Earn Rewards!</h3>
                </div>
                <div className="space-y-3 font-handwriting text-base lg:text-lg text-slate-700">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 lg:w-6 h-5 lg:h-6 text-slate-500 animate-pulse" />
                    <span>ERC20 tokens</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 lg:w-6 h-5 lg:h-6 text-emerald-500 animate-pulse" />
                    <span>Speed bonuses</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 lg:w-6 h-5 lg:h-6 text-slate-500 animate-pulse" />
                    <span>Leaderboards</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Bar */}
            <ActionBar isConnected={isConnected} disconnect={disconnect} />
          </div>
        )}


      </div>
    </FarcasterUI>
  );
}