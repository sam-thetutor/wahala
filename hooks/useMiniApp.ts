'use client';

import { useMiniKit } from '@coinbase/onchainkit/minikit';

export function useMiniApp() {
  const miniKit = useMiniKit();
  
  // Return the OnchainKit MiniKit data with fallback values
  // Using any type to avoid TypeScript errors with the OnchainKit API
  const miniKitData = miniKit as any;
  
  return {
    isMiniApp: miniKitData?.isMiniApp || false,
    userFid: miniKitData?.user?.fid,
    username: miniKitData?.user?.username,
    displayName: miniKitData?.user?.displayName,
    pfpUrl: miniKitData?.user?.pfpUrl,
    isAdded: miniKitData?.isAdded,
    location: miniKitData?.location,
    composeCast: async (text: string, embeds?: string[]) => {
      if (miniKitData?.composeCast) {
        return miniKitData.composeCast(text, embeds);
      }
      console.log('Compose cast (fallback):', text, embeds);
    },
    triggerHaptic: (type: 'light' | 'medium' | 'heavy') => {
      if (miniKitData?.triggerHaptic) {
        return miniKitData.triggerHaptic(type);
      }
      console.log('Haptic feedback (fallback):', type);
    },
    addToFarcaster: async () => {
      if (miniKitData?.addToFarcaster) {
        return miniKitData.addToFarcaster();
      }
      console.log('Add to Farcaster (fallback)');
    }
  };
}