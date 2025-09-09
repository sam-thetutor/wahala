'use client';

import React, { ReactNode } from 'react';
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { celo } from '@reown/appkit/networks';

interface MiniAppWrapperProps {
  children: ReactNode;
}

export const MiniAppWrapper: React.FC<MiniAppWrapperProps> = ({ children }) => {
  return (
    <MiniKitProvider chain={celo}>
      {children}
    </MiniKitProvider>
  );
};

export default MiniAppWrapper;
