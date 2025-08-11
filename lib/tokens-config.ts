export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  network: string;
  chainId: number;
  logoUrl?: string;
  isStablecoin?: boolean;
  isNative?: boolean;
}

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Supported networks
export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  celo: {
    name: 'Celo',
    chainId: 42220,
    rpcUrl: 'https://forno.celo.org',
    blockExplorer: 'https://celoscan.io',
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18,
    },
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  }
};

// Entry fee tokens (spam control)
export const ENTRY_FEE_TOKENS: TokenConfig[] = [
  // Celo Network
  {
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    symbol: 'cUSD',
    name: 'Celo Dollar',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
    isStablecoin: true,
  },
  {
    address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    symbol: 'cEUR',
    name: 'Celo Euro',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
    isStablecoin: true,
  },
  {
    address: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
    symbol: 'cREAL',
    name: 'Celo Real',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
    isStablecoin: true,
  },
  // Base Network
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin (Base)',
    decimals: 6,
    network: 'Base',
    chainId: 8453,
    isStablecoin: true,
  },
  // Ethereum
  {
    address: '0xA0b86a33E6411D4d97baB2ACE8B4Cd6E3f6D8EeB',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    network: 'Ethereum',
    chainId: 1,
    isStablecoin: true,
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    network: 'Ethereum',
    chainId: 1,
    isStablecoin: true,
  },
  // Polygon
  {
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    symbol: 'USDC',
    name: 'USD Coin (Polygon)',
    decimals: 6,
    network: 'Polygon',
    chainId: 137,
    isStablecoin: true,
  },
  {
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    symbol: 'USDT',
    name: 'Tether USD (Polygon)',
    decimals: 6,
    network: 'Polygon',
    chainId: 137,
    isStablecoin: true,
  },
  // Arbitrum
  {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    symbol: 'USDC',
    name: 'USD Coin (Arbitrum)',
    decimals: 6,
    network: 'Arbitrum One',
    chainId: 42161,
    isStablecoin: true,
  },
  // Base
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin (Base)',
    decimals: 6,
    network: 'Base',
    chainId: 8453,
    isStablecoin: true,
  },
  // SNARKEL tokens for entry fees
  {
    address: '0xf18e87167db07da9160d790d87dc9d39e8147e4d',
    symbol: 'SNARKEL',
    name: 'Snarkel Token (Celo)',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
  },
  {
    address: '0xe75a890ad702b14b7935bc1ba81067f2b93f35d0',
    symbol: 'SNARKEL',
    name: 'Snarkel Token (Base)',
    decimals: 18,
    network: 'Base',
    chainId: 8453,
  },
];

// Reward tokens (more comprehensive list including native tokens and popular tokens)
export const REWARD_TOKENS: TokenConfig[] = [
  // Native tokens
  {
    address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    symbol: 'CELO',
    name: 'Celo Native Token',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
    isNative: true,
  },
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    network: 'Ethereum',
    chainId: 1,
    isNative: true,
  },
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'MATIC',
    name: 'Polygon Matic',
    decimals: 18,
    network: 'Polygon',
    chainId: 137,
    isNative: true,
  },
  
  // Celo ecosystem tokens
  {
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    symbol: 'cUSD',
    name: 'Celo Dollar',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
    isStablecoin: true,
  },
  {
    address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    symbol: 'cEUR',
    name: 'Celo Euro',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
    isStablecoin: true,
  },
  {
    address: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
    symbol: 'cREAL',
    name: 'Celo Real',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
    isStablecoin: true,
  },
  
  // Popular DeFi tokens on different networks
  {
    address: '0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC',
    symbol: 'UBE',
    name: 'Ubeswap Token',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
  },
  {
    address: '0x32A9FE697a32135BFd313a6Ac28792DaE4D9979d',
    symbol: 'cMCO2',
    name: 'Celo Moss Carbon Credit',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
  },
  
  // SNARKEL tokens
  {
    address: '0xf18e87167db07da9160d790d87dc9d39e8147e4d',
    symbol: 'SNARKEL',
    name: 'Snarkel Token (Celo)',
    decimals: 18,
    network: 'Celo',
    chainId: 42220,
  },
  {
    address: '0xe75a890ad702b14b7935bc1ba81067f2b93f35d0',
    symbol: 'SNARKEL',
    name: 'Snarkel Token (Base)',
    decimals: 18,
    network: 'Base',
    chainId: 8453,
  },
  
  // Custom token option
  {
    address: 'custom',
    symbol: 'CUSTOM',
    name: 'Custom Token',
    decimals: 18,
    network: 'Custom',
    chainId: 0,
  },
];

// Helper functions
export function getTokensByNetwork(network: string): TokenConfig[] {
  return REWARD_TOKENS.filter(token => token.network === network);
}

export function getEntryFeeTokensByNetwork(network: string): TokenConfig[] {
  return ENTRY_FEE_TOKENS.filter(token => token.network === network);
}

export function findToken(address: string, network: string): TokenConfig | undefined {
  return REWARD_TOKENS.find(token => 
    token.address.toLowerCase() === address.toLowerCase() && 
    token.network === network
  );
}

export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(SUPPORTED_NETWORKS).find(network => network.chainId === chainId);
}

export function isStablecoin(tokenSymbol: string): boolean {
  const stablecoins = ['USDC', 'USDT', 'DAI', 'cUSD', 'cEUR', 'cREAL', 'BUSD', 'FRAX'];
  return stablecoins.includes(tokenSymbol.toUpperCase());
}

// Default entry fee configurations
export const DEFAULT_ENTRY_FEES = {
  'Celo': {
    amount: '0.5',
    token: ENTRY_FEE_TOKENS.find(t => t.symbol === 'cUSD' && t.network === 'Celo')!
  },
  'Ethereum': {
    amount: '0.5',
    token: ENTRY_FEE_TOKENS.find(t => t.symbol === 'USDC' && t.network === 'Ethereum')!
  },
  'Polygon': {
    amount: '0.5',
    token: ENTRY_FEE_TOKENS.find(t => t.symbol === 'USDC' && t.network === 'Polygon')!
  },
  'Arbitrum One': {
    amount: '0.5',
    token: ENTRY_FEE_TOKENS.find(t => t.symbol === 'USDC' && t.network === 'Arbitrum One')!
  },
  'Base': {
    amount: '0.5',
    token: ENTRY_FEE_TOKENS.find(t => t.symbol === 'USDC' && t.network === 'Base')!
  },
};

// SNARKEL token configurations for each network
export const SNARKEL_TOKENS = {
  'Celo': {
    address: '0xf18e87167db07da9160d790d87dc9d39e8147e4d',
    symbol: 'SNARKEL',
    name: 'Snarkel Token (Celo)',
    decimals: 18,
    chainId: 42220,
  },
  'Base': {
    address: '0xe75a890ad702b14b7935bc1ba81067f2b93f35d0',
    symbol: 'SNARKEL',
    name: 'Snarkel Token (Base)',
    decimals: 18,
    chainId: 8453,
  },
}; 