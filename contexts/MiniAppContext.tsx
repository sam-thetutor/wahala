'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFarcaster } from '@/components/FarcasterProvider';

interface MiniAppContextType {
  isMiniApp: boolean;
  composeCast: (text: string, embeds?: string[]) => Promise<void>;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => Promise<void>;
  addToFarcaster: () => Promise<void>;
}

export const MiniAppContext = createContext<MiniAppContextType | undefined>(undefined);

export const MiniAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isInFarcasterContext } = useFarcaster();
  
  // Simple detection for mini app context
  const [isMiniApp, setIsMiniApp] = useState(false);
  
  useEffect(() => {
    // Check if we're in a mini app context
    const checkMiniApp = () => {
      const isInFrame = window !== window.top;
      const hasFarcasterContext = isInFarcasterContext();
      setIsMiniApp(isInFrame || hasFarcasterContext);
    };
    
    checkMiniApp();
    
    // Listen for changes in Farcaster context
    const interval = setInterval(checkMiniApp, 1000);
    return () => clearInterval(interval);
  }, [isInFarcasterContext]);

  const composeCast = async (text: string, embeds?: string[]) => {
    if (!isMiniApp) {
      console.warn('Not in Mini App context');
      return;
    }

    try {
      // This would integrate with Farcaster SDK
      console.log('Composing cast:', { text, embeds });
      // In a real implementation, you'd call the Farcaster SDK here
    } catch (error) {
      console.error('Failed to compose cast:', error);
    }
  };

  const triggerHaptic = async (type: 'light' | 'medium' | 'heavy') => {
    if (!isMiniApp) {
      return;
    }

    try {
      // This would trigger haptic feedback
      console.log('Triggering haptic feedback:', type);
      // In a real implementation, you'd call the haptic API here
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
    }
  };

  const addToFarcaster = async () => {
    if (!isMiniApp) {
      return;
    }

    try {
      // This would add the app to Farcaster
      console.log('Adding to Farcaster');
      // In a real implementation, you'd call the Farcaster SDK here
    } catch (error) {
      console.error('Failed to add to Farcaster:', error);
    }
  };

  const value: MiniAppContextType = {
    isMiniApp,
    composeCast,
    triggerHaptic,
    addToFarcaster
  };

  return (
    <MiniAppContext.Provider value={value}>
      {children}
    </MiniAppContext.Provider>
  );
};

export const useMiniApp = (): MiniAppContextType => {
  const context = useContext(MiniAppContext);
  if (context === undefined) {
    throw new Error('useMiniApp must be used within a MiniAppProvider');
  }
  return context;
};
