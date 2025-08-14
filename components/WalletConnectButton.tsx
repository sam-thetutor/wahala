'use client';

import React from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet, LogOut, Sparkles } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';

interface WalletConnectButtonProps {
  compact?: boolean;
}

export default function WalletConnectButton({ compact = false }: WalletConnectButtonProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 ${compact ? 'px-2 py-1.5' : 'px-4 py-2'} bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg text-white font-semibold`}>
          <Sparkles className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
          <span className={compact ? 'text-xs' : ''}>{formatAddress(address)}</span>
        </div>
        <button
          onClick={() => disconnect()}
          className={`${compact ? 'p-1.5' : 'p-2'} bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors`}
          title="Disconnect Wallet"
        >
          <LogOut className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      className={`flex items-center gap-2 ${compact ? 'px-2 py-1.5' : 'px-4 py-2'} bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all`}
    >
      <Wallet className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className={compact ? 'text-xs' : ''}>
        {compact ? 'Connect' : 'Connect Wallet'}
      </span>
    </button>
  );
} 