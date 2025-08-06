'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Trophy, Zap, Star, Shield, Gift, Play, Sparkles, Gamepad2, ArrowDown, ExternalLink } from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { FarcasterUI, FarcasterShareButton, FarcasterAddButton, FarcasterComposeButton } from '@/components/FarcasterUI';
import { FarcasterContextDisplay, FarcasterUserInfo } from '@/components/FarcasterContextDisplay';


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
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

  return (
    <FarcasterUI>
      <div className="min-h-screen overflow-hidden relative">
        {/* Farcaster Context Display */}
        <FarcasterContextDisplay />
        
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
          <div className="relative z-10 min-h-screen p-6 flex flex-col">
            {/* Mobile Wallet Connect Button - Top Right */}
            <div className="absolute top-4 right-4 z-50">
              <WalletConnectButton />
            </div>
            {/* Mobile Header */}
            <div className={`text-center mb-8 transition-all duration-1500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-white shadow-2xl rounded-3xl p-6 relative overflow-hidden" 
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
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Gamepad2 className="w-12 h-12 animate-bounce-slow" style={{ color: '#476520' }} />
                    <h1 className="font-handwriting text-4xl" style={{ color: '#476520' }}>
                      Snarkels
                    </h1>
                  </div>
                  <p className="font-handwriting text-lg" style={{ color: '#655947' }}>
                    Knowledge meets web3 rewards
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Main Actions - Centered and Prominent */}
            <div className={`flex-1 flex flex-col justify-center space-y-8 transition-all duration-1500 delay-300 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>
              {/* Main JOIN button */}
              <div className="relative">
                <div className="absolute inset-0 bg-green-300 rounded-3xl blur-2xl opacity-40 animate-pulse"></div>
                
                <Link href="/join" className="relative block">
                  <button className="w-full px-8 py-6 rounded-3xl font-bold text-2xl text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 shadow-2xl"
                          style={{
                            backgroundImage: `
                              linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                              radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)
                            `
                          }}>
                    <span className="relative z-10 flex items-center justify-center gap-4">
                      <Users className="w-8 h-8" />
                      JOIN A SNARKEL
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </Link>
              </div>
              
              {/* Secondary CREATE button */}
              <div className="relative">
                <Link href="/create">
                  <div className="bg-white shadow-xl rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border-2 border-yellow-400 relative overflow-hidden"
                       style={{
                         backgroundImage: `
                           radial-gradient(circle at bottom left, rgba(252, 255, 82, 0.1) 0%, transparent 50%),
                           linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)
                         `
                       }}>
                    {/* Texture overlay */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                         style={{
                           backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
                           backgroundSize: '8px 8px'
                         }}></div>
                    
                    <span className="font-handwriting text-xl text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 relative z-10" 
                          style={{ color: '#476520' }}>
                      <Plus className="w-6 h-6" />
                      or Host a Snarkel
                    </span>
                  </div>
                </Link>
              </div>
              {/* Wallet Connect Button below Host a Snarkel */}
              <div className="mt-6 flex justify-center">
                <WalletConnectButton />
              </div>
            </div>

            {/* Mobile Status */}
            <div className={`text-center mt-8 transition-all duration-1500 delay-500 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="bg-gradient-to-r from-green-50 to-emerald-100 shadow-lg rounded-2xl p-4 relative overflow-hidden border border-green-200"
                   style={{
                     backgroundImage: `radial-gradient(circle at center, rgba(86, 223, 124, 0.1) 0%, transparent 50%)`
                   }}>
                <div className="flex items-center justify-center gap-3 font-handwriting text-lg" style={{ color: '#476520' }}>
                  <div className="w-3 h-3 rounded-full animate-pulse bg-green-400 shadow-lg"></div>
                  <span>Live on Celo Network</span>
                  <Sparkles className="w-6 h-6 text-yellow-500 animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Layout */
          <div className="relative z-10 min-h-screen p-8 lg:p-16">
            {/* Wallet Connect Button - Top Right (REMOVED) */}
            
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

            {/* What you can do - positioned to avoid overlap */}
            <div className={`absolute top-8 right-8 lg:top-20 lg:right-16 max-w-sm transition-all duration-1500 delay-300 ${
              isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 shadow-2xl rounded-3xl p-6 lg:p-8 transform rotate-1 hover:-rotate-1 transition-all duration-500 relative border-l-4 border-blue-400 overflow-hidden">
                {/* Pin effect */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full shadow-lg border-2 border-white"></div>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 rounded-full"></div>
                
                {/* Texture overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                     style={{
                       backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
                       backgroundSize: '10px 10px'
                     }}></div>
                
                <div className="relative z-10">
                  <h3 className="font-handwriting text-2xl lg:text-3xl mb-6 text-center" style={{ color: '#476520' }}>
                    What you can do:
                  </h3>
                  <div className="space-y-4 font-handwriting text-base lg:text-lg" style={{ color: '#655947' }}>
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

            {/* Main action buttons - center */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1500 delay-700 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}>
              <div className="text-center space-y-8">
                {/* JOIN button */}
                <div className="relative">
                  <div className="absolute inset-0 bg-green-300 rounded-3xl blur-2xl opacity-40 animate-pulse"></div>
                  
                  <Link href="/join" className="relative block">
                    <button className="px-12 lg:px-16 py-6 lg:py-8 rounded-3xl font-bold text-2xl lg:text-3xl text-white transition-all duration-300 hover:scale-110 hover:shadow-2xl transform hover:-rotate-2 relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 shadow-2xl"
                            style={{
                              backgroundImage: `
                                linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                                radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)
                              `
                            }}>
                      <span className="relative z-10 flex items-center gap-4">
                        <Users className="w-6 lg:w-8 h-6 lg:h-8" />
                        JOIN A SNARKEL
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </Link>
                </div>
                
                {/* CREATE button */}
                <div className="relative group">
                  <Link href="/create">
                    <div className="bg-white shadow-xl rounded-2xl p-6 transform rotate-1 hover:-rotate-1 transition-all duration-300 hover:scale-105 border-2 border-yellow-400 relative overflow-hidden"
                         style={{
                           backgroundImage: `
                             radial-gradient(circle at bottom left, rgba(252, 255, 82, 0.1) 0%, transparent 50%),
                             linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)
                           `
                         }}>
                      {/* Texture overlay */}
                      <div className="absolute inset-0 opacity-20 pointer-events-none"
                           style={{
                             backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0.02) 2px)`,
                             backgroundSize: '8px 8px'
                           }}></div>
                      
                      <span className="font-handwriting text-xl lg:text-2xl text-center block transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 relative z-10" 
                            style={{ color: '#476520' }}>
                        <Plus className="w-6 h-6" />
                        or Host a Snarkel →
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
              {/* Wallet Connect Button below Host a Snarkel */}
              <div className="mt-6 flex justify-center">
                <WalletConnectButton />
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
                    <h3 className="font-handwriting text-2xl lg:text-3xl" style={{ color: '#476520' }}>Earn Rewards!</h3>
                  </div>
                  <div className="space-y-3 font-handwriting text-base lg:text-lg" style={{ color: '#655947' }}>
                    <div className="flex items-center gap-3 bg-white bg-opacity-70 p-3 rounded-lg hover:scale-105 transition-transform">
                      <Zap className="w-5 lg:w-6 h-5 lg:h-6 text-yellow-500 animate-pulse" />
                      <span>CELO tokens</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white bg-opacity-70 p-3 rounded-lg hover:scale-105 transition-transform">
                      <Star className="w-5 lg:w-6 h-5 lg:h-6 text-green-500 animate-pulse" />
                      <span>Speed bonuses</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white bg-opacity-70 p-3 rounded-lg hover:scale-105 transition-transform">
                      <Shield className="w-5 lg:w-6 h-5 lg:h-6 text-blue-500 animate-pulse" />
                      <span>Leaderboards</span>
                    </div>
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
                    </div>
                    <span className="text-center">on Celo Network</span>
                    <Sparkles className="w-6 lg:w-8 h-6 lg:h-8 text-yellow-500 animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </FarcasterUI>
  );
}