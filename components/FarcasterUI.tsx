'use client'

import { useFarcaster } from './FarcasterProvider'
import { Share2, Download, CheckCircle, MessageCircle, Plus } from 'lucide-react'

interface FarcasterUIProps {
  children?: React.ReactNode
}

export function FarcasterUI({ children }: FarcasterUIProps) {
  const { isFarcasterApp, addToFarcaster, shareApp } = useFarcaster()

  if (!isFarcasterApp) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {children}
      
      {/* Farcaster-specific floating action buttons */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col gap-3">
          <button
            onClick={addToFarcaster}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors"
            title="Add to Farcaster"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button
            onClick={shareApp}
            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-colors"
            title="Share Snarkels"
          >
            <Share2 className="w-5 h-5" />
          </button>
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
      className={`flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors ${className}`}
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
      className={`flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors ${className}`}
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
      className={`flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      {title}
    </button>
  )
} 