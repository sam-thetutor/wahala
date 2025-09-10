'use client';

import React, { useEffect, useState } from 'react';
import { appKit } from '@/config';
import { useFarcaster } from '@/components/FarcasterProvider';
import { useAccount, useConnect, useChainId, useSwitchChain } from 'wagmi';

export default function AppKitProvider({ children }: { children: React.ReactNode }) {
  const { isInFarcasterContext, context } = useFarcaster();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    // Detect if we're in a Farcaster Mini App
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

  useEffect(() => {
    // Auto-connect to Farcaster wallet if in Mini App context and not connected
    if (isMiniApp && !isConnected) {
      console.log('Auto-connecting to Farcaster wallet in Mini App context');
      
      // Find the Farcaster connector
      const farcasterConnector = connectors.find(connector => 
        connector.id === 'farcasterFrame' || connector.name === 'Farcaster'
      );
      
      if (farcasterConnector) {
        console.log('Found Farcaster connector, attempting auto-connect');
        try {
          connect({ connector: farcasterConnector });
        } catch (error) {
          console.error('Failed to auto-connect to Farcaster wallet:', error);
        }
      } else {
        console.warn('Farcaster connector not found');
        // List all available connectors for debugging
        console.log('Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));
      }
    }
  }, [isMiniApp, isConnected, connect, connectors]);

  // Auto-switch to Celo Mainnet when connected to wrong chain
  useEffect(() => {
    if (isConnected && chainId && chainId !== 42220) {
      console.log('🔄 Auto-switching to Celo Mainnet from AppKitProvider...', { currentChainId: chainId });
      try {
        switchChain({ chainId: 42220 });
      } catch (error) {
        console.error('❌ Failed to auto-switch to Celo Mainnet:', error);
      }
    }
  }, [isConnected, chainId, switchChain]);

  // AppKit is already configured in the layout, just return children
  return <>{children}</>;
}
