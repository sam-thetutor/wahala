'use client';

import React, { useEffect } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { Wallet, LogOut, Sparkles, Loader2 } from 'lucide-react';

export default function WalletConnectButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors, error, isPending } = useConnect();

  // Debug: Log available connectors and connection state
  useEffect(() => {
    console.log('WalletConnectButton - Available connectors:', connectors);
    console.log('WalletConnectButton - Current wallet state:', { 
      isConnected, 
      address, 
      isConnecting, 
      isPending,
      error 
    });
    
    // Log each connector's details
    connectors.forEach((connector, index) => {
      console.log(`Connector ${index}:`, {
        id: connector.id,
        name: connector.name,
        ready: connector.ready,
        icon: connector.icon
      });
    });
  }, [connectors, isConnected, address, isConnecting, isPending, error]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = (connector: any) => {
    console.log('Attempting to connect with connector:', connector);
    connect({ connector });
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg text-white font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>{formatAddress(address)}</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          title="Disconnect Wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (isConnecting || isPending) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold opacity-75"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => {
          // Try to connect with the first available connector
          if (connectors.length > 0) {
            handleConnect(connectors[0]);
          }
        }}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
      
      {/* Show available connectors for debugging */}
      {connectors.length > 0 && (
        <div className="text-xs text-gray-500">
          Available: {connectors.map(c => c.name).join(', ')}
        </div>
      )}
      
      {/* Show connection error if any */}
      {error && (
        <div className="text-xs text-red-500">
          Error: {error.message}
        </div>
      )}
    </div>
  );
} 