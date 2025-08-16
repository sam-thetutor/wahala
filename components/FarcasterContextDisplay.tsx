'use client'

import { useFarcaster } from './FarcasterProvider'
import { User, Smartphone, MapPin, Bell, Zap } from 'lucide-react'

export function FarcasterContextDisplay() {
  const { isFarcasterApp, context } = useFarcaster()

  if (!isFarcasterApp || !context) {
    return null
  }
  //return null alwyas for testing
  return null;

  return (
    <div className="fixed top-4 left-4 z-50 max-w-sm">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Farcaster Context
        </h3>
        
        <div className="space-y-3 text-xs">
          {/* User Info */}
          {context.user && (
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-blue-500" />
              <span className="text-gray-600">
                {context.user.displayName || context.user.username || `FID: ${context.user.fid}`}
              </span>
            </div>
          )}
          
          {/* Client Info */}
          {context.client && (
            <div className="flex items-center gap-2">
              <Smartphone className="w-3 h-3 text-green-500" />
              <span className="text-gray-600">
                {context.client.platformType || 'unknown'} • Added: {context.client.added ? 'Yes' : 'No'}
              </span>
            </div>
          )}
          
          {/* Location Context */}
          {context.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-red-500" />
              <span className="text-gray-600">
                {context.location.type}
                {context.location.type === 'cast_embed' && context.location.cast && (
                  <span> • by {context.location.cast.author.displayName || context.location.cast.author.username}</span>
                )}
              </span>
            </div>
          )}
          
          {/* Features */}
          {context.features && (
            <div className="flex items-center gap-2">
              <Bell className="w-3 h-3 text-purple-500" />
              <span className="text-gray-600">
                Haptics: {context.features.haptics ? 'Yes' : 'No'}
                {context.features.cameraAndMicrophoneAccess !== undefined && (
                  <span> • Camera: {context.features.cameraAndMicrophoneAccess ? 'Yes' : 'No'}</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function FarcasterUserInfo() {
  const { isFarcasterApp, context } = useFarcaster()

  if (!isFarcasterApp || !context?.user) {
    return null
  }

  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
      {context.user.pfpUrl && (
        <img 
          src={context.user.pfpUrl} 
          alt="Profile" 
          className="w-6 h-6 rounded-full"
        />
      )}
      <span className="text-sm font-medium text-gray-700">
        {context.user.displayName || context.user.username || `FID: ${context.user.fid}`}
      </span>
    </div>
  )
} 