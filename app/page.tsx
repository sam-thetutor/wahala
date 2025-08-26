'use client';

import React, { useState, useEffect } from 'react';
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
  LogOut
} from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { FarcasterUI } from '@/components/FarcasterUI';
import { useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { useFarcaster } from '@/components/FarcasterProvider';
import { useMiniApp } from '@/hooks/useMiniApp';
import FarcasterUserProfile from '@/components/FarcasterUserProfile';
import BottomNavigation from '@/components/BottomNavigation';




export default function HomePage() {
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
  // Action bar is always visible, no need for open/close state

  const { isConnected } = useAccount();
  const { isInFarcasterContext } = useFarcaster();
  const { isMiniApp, context: miniAppContext, userFid, username, displayName, pfpUrl } = useMiniApp();





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

            {/* Farcaster User Profile - Show when in Farcaster context OR Mini App context */}
            {(isInFarcasterContext() || isMiniApp) && (
              <div className="mb-6">
                <FarcasterUserProfile variant="inline" showPfp={true} showEmoji={true} />
              </div>
            )}

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
              
              {/* Action Buttons */}
              <div className="text-center px-2 space-y-4">
                {/* Play Button */}
                <Link
                  href="/join"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black text-lg text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-400/80 to-purple-500/80 hover:from-blue-300/90 hover:to-purple-400/90 overflow-hidden group"
                >
                  <span className="font-handwriting">Play a Snarkel</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                {/* Two Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Link
                    href="/featured"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-base text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-emerald-500/80 to-teal-500/80 hover:from-emerald-400/90 hover:to-teal-400/90 overflow-hidden group"
                  >
                    <span className="font-handwriting">Explore Featured</span>
                    <Star className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  </Link>
                  
                  <Link
                    href="/create"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-base text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-orange-500/80 to-red-500/80 hover:from-orange-400/90 hover:to-red-400/90 overflow-hidden group"
                  >
                    <span className="font-handwriting">Create Snarkel</span>
                    <Plus className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Bottom Navigation */}
            <BottomNavigation />
          </div>
        ) : (
          /* Desktop Layout */
          <div className="relative z-10 min-h-screen p-8 lg:p-16 pb-24">


            {/* Farcaster User Profile - Show when in Farcaster context OR Mini App context */}
            {(isInFarcasterContext() || isMiniApp) && (
              <div className={`absolute top-8 right-8 lg:top-16 lg:right-16 transition-all duration-1500 delay-200 ${
                isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}>
                <FarcasterUserProfile variant="inline" showPfp={true} showEmoji={true} />
              </div>
            )}

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

              
              {/* Action Buttons */}
              <div className="text-center space-y-6">
                {/* Play Button */}
                <Link
                  href="/join"
                  className="inline-flex items-center justify-center gap-3 px-12 py-4 rounded-xl font-black text-2xl text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-blue-400/80 to-purple-500/80 hover:from-blue-300/90 hover:to-purple-400/90 overflow-hidden group"
                >
                  <span className="font-handwriting">Play a Snarkel</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                {/* Two Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href="/featured"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-emerald-500/80 to-teal-500/80 hover:from-emerald-400/90 hover:to-teal-400/90 overflow-hidden group"
                  >
                    <span className="font-handwriting">Explore Featured</span>
                    <Star className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </Link>
                  
                  <Link
                    href="/create"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg text-white hover:scale-105 transition-all duration-300 shadow-lg bg-gradient-to-r from-orange-500/80 to-red-500/80 hover:from-orange-400/90 hover:to-red-400/90 overflow-hidden group"
                  >
                    <span className="font-handwriting">Create Snarkel</span>
                    <Plus className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </Link>
                </div>
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
            
            {/* Bottom Navigation */}
            <BottomNavigation />
          </div>
        )}


      </div>
    </FarcasterUI>
  );
}