'use client'

import { useFarcaster } from './FarcasterProvider'
import { Share2, Download, CheckCircle, MessageCircle, Plus, X } from 'lucide-react'
import { useState } from 'react'

interface FarcasterUIProps {
  children?: React.ReactNode
}

export function FarcasterUI({ children }: FarcasterUIProps) {
  const { isFarcasterApp, isReady, addToFarcaster, shareApp, callReady } = useFarcaster()

  if (!isFarcasterApp) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {children}
      
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
      className={`farcaster-button bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-emerald-300 ${className}`}
      title={title}
    >
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        <span className="font-medium">{title}</span>
      </div>
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
      className={`farcaster-button bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-blue-300 ${className}`}
      title={title}
    >
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        <span className="font-medium">{title}</span>
      </div>
    </button>
  )
} 