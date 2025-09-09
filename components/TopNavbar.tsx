'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import WalletConnectButton from './WalletConnectButton';
import FireworksCelebration from './FireworksCelebration';
import { useCelebration } from '../hooks/useCelebration';

const TopNavbar: React.FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { celebrations, completeCelebration } = useCelebration();
  const { isConnected, address } = useAccount();
  
  // Admin address check
  const isAdmin = address?.toLowerCase() === '0x21d654daab0fe1be0e584980ca7c1a382850939f';

  const isActiveLink = (path: string) => {
    return pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/logo.png" alt="Snarkels" className="w-8 h-8" />
                <span className="font-handwriting text-xl font-bold text-slate-800">Zyn</span>
              </Link>
            </div>

            {/* Right Side - Navigation Links + Wallet Connection */}
            <div className="flex items-center space-x-8">
              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link 
                  href="/" 
                  className={`transition-colors font-medium ${
                    isActiveLink('/') 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/markets" 
                  className={`transition-colors font-medium ${
                    isActiveLink('/markets') 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Markets
                </Link>
                <Link 
                  href="/leaderboard" 
                  className={`transition-colors font-medium ${
                    isActiveLink('/leaderboard') 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  🏆 Leaderboard
                </Link>
                {isConnected && (
                  <>
                    <Link 
                      href="/create-market" 
                      className={`transition-colors font-medium ${
                        isActiveLink('/create-market') 
                          ? 'text-blue-600' 
                          : 'text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      Create Market
                    </Link>
                    <Link 
                      href="/profile" 
                      className={`transition-colors font-medium ${
                        isActiveLink('/profile') 
                          ? 'text-blue-600' 
                          : 'text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      Profile
                    </Link>
                  </>
                )}
                {isConnected && isAdmin && (
                  <Link 
                    href="/admin" 
                    className={`transition-colors font-medium ${
                      isActiveLink('/admin') 
                        ? 'text-blue-600' 
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </nav>

              {/* Wallet Connection */}
              <div className="hidden md:flex items-center">
                <WalletConnectButton />
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Modal - Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeMobileMenu}
          ></div>
          
          {/* Modal Content */}
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Navigation Links */}
              <nav className="space-y-2">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveLink('/')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/markets"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveLink('/markets')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Markets
                </Link>
                <Link
                  href="/leaderboard"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveLink('/leaderboard')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  🏆 Leaderboard
                </Link>
                {isConnected && (
                  <>
                    <Link
                      href="/create-market"
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActiveLink('/create-market')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Create Market
                    </Link>
                    <Link
                      href="/profile"
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActiveLink('/profile')
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Profile
                    </Link>
                  </>
                )}
                {isConnected && isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActiveLink('/admin')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </nav>
              
              {/* Wallet Connection */}
              <div className="pt-4 border-t border-gray-200">
                <div className="px-3 py-2">
                  <WalletConnectButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Fireworks Celebration for Market Creation */}
      <FireworksCelebration 
        trigger={celebrations.marketCreated} 
        onComplete={() => completeCelebration('marketCreated')}
      />
      
      {/* Fireworks Celebration for Shares Bought */}
      <FireworksCelebration 
        trigger={celebrations.sharesBought} 
        onComplete={() => completeCelebration('sharesBought')}
      />
      
      {/* Fireworks Celebration for Market Resolved */}
      <FireworksCelebration 
        trigger={celebrations.marketResolved} 
        onComplete={() => completeCelebration('marketResolved')}
      />
    </>
  );
};

export default TopNavbar;
