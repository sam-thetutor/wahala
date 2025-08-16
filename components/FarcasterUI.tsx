'use client'

import { useFarcaster } from './FarcasterProvider'
import { Share2, Download, CheckCircle, MessageCircle, Plus, X } from 'lucide-react'
import { useState } from 'react'

interface FarcasterUIProps {
  children?: React.ReactNode
}

export function FarcasterUI({ children }: FarcasterUIProps) {
  const { isFarcasterApp, isReady, addToFarcaster, shareApp, callReady } = useFarcaster()
  const [showWelcome, setShowWelcome] = useState(true)

  if (!isFarcasterApp) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {children}
      
      {/* Farcaster Welcome Banner */}
      {showWelcome && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 farcaster-context">
          <div className="bg-gradient-to-r from-blue-600 to-slate-500 text-white rounded-2xl p-4 shadow-2xl border border-blue-300 relative">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors farcaster-button"
            >
              <X className="w-3 h-3" />
            </button>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-300 rounded-full animate-pulse"></div>
                <span className="font-semibold text-sm">Welcome to Snarkels!</span>
                <div className="w-3 h-3 bg-blue-300 rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs text-blue-100 mb-3">
                You're now playing in Farcaster Mini App mode. Enjoy interactive quizzes with crypto rewards!
              </p>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="px-2 py-1 bg-white/20 rounded-full">🎯 Quizzes</span>
                <span className="px-2 py-1 bg-white/20 rounded-full">💰 Rewards</span>
                <span className="px-2 py-1 bg-white/20 rounded-full">🏆 Leaderboards</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug info - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 left-4 z-50 bg-gradient-to-r from-blue-600 to-slate-500 text-white p-3 rounded-2xl shadow-2xl border border-blue-300">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
            <span className="font-semibold text-xs">Farcaster Debug</span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isFarcasterApp ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {isFarcasterApp ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Ready:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isReady ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {isReady ? 'Ready' : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Farcaster-specific floating action buttons */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col gap-4 farcaster-button-stack">
          {/* Ready button - shows when app isn't ready yet */}
          {!isReady && (
            <div className="relative group">
              <button
                onClick={callReady}
                className="farcaster-button farcaster-floating bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-110 border-2 border-red-300 animate-pulse-blue"
                title="Dismiss Splash Screen"
              >
                <CheckCircle className="w-6 h-6" />
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none farcaster-tooltip">
                Dismiss Splash Screen
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
              </div>
            </div>
          )}
          
          {/* Add to Farcaster Button */}
          <div className="relative group">
            <button
              onClick={addToFarcaster}
              className="farcaster-button farcaster-floating bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-110 border-2 border-blue-300 animate-pulse-blue"
              title="Add to Farcaster"
            >
              <Plus className="w-6 h-6" />
            </button>
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none farcaster-tooltip">
              Add to Farcaster
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
            </div>
          </div>
          
          {/* Share App Button */}
          <div className="relative group">
            <button
              onClick={shareApp}
              className="farcaster-button farcaster-floating bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-110 border-2 border-emerald-300 animate-pulse-blue"
              title="Share Snarkels"
            >
              <Share2 className="w-6 h-6" />
            </button>
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none farcaster-tooltip">
              Share Snarkels
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FarcasterShareButton({ 
  title = "Share Snarkels", 
  className = "" 
}: { 
  title?: string
  className?: string 
}) {
  const { isFarcasterApp, shareApp } = useFarcaster()

  if (!isFarcasterApp) {
    return null
  }

  return (
    <button
      onClick={shareApp}
      className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg border border-emerald-300 ${className}`}
    >
      <Share2 className="w-4 h-4" />
      {title}
    </button>
  )
}

export function FarcasterAddButton({ 
  title = "Add to Farcaster", 
  className = "" 
}: { 
  title?: string
  className?: string 
}) {
  const { isFarcasterApp, addToFarcaster } = useFarcaster()

  if (!isFarcasterApp) {
    return null
  }

  return (
    <button
      onClick={addToFarcaster}
      className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg border border-blue-300 ${className}`}
    >
      <Plus className="w-4 h-4" />
      {title}
    </button>
  )
}

export function FarcasterComposeButton({ 
  text = "Just played Snarkels! 🎯",
  embeds = ["https://snarkels.vercel.app"],
  title = "Share Experience",
  className = "" 
}: { 
  text?: string
  embeds?: [] | [string] | [string, string]
  title?: string
  className?: string 
}) {
  const { isFarcasterApp, composeCast } = useFarcaster()

  if (!isFarcasterApp) {
    return null
  }

  const handleCompose = async () => {
    await composeCast(text, embeds)
  }

  return (
    <button
      onClick={handleCompose}
      className={`flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg border border-purple-300 ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      {title}
    </button>
  )
} 