/**
 * Central configuration for contract addresses
 * This file serves as the single source of truth for all contract addresses
 */


// New deployed contract addresses
export const CONTRACT_ADDRESSES = {
  // Celo Mainnet
  CELO: {
    PREDICTION_MARKET_CORE: '0x35f61008878b85B4239C1EF714989B236757a283',
    PREDICTION_MARKET_CLAIMS: '0x2FDd27190d3A7EB376f06D391d7e0F4fF7811350',
  },
  // Base Mainnet
  BASE: {
    PREDICTION_MARKET_CORE: '0x0000000000000000000000000000000000000000',
    PREDICTION_MARKET_CLAIMS: '0x0000000000000000000000000000000000000000',
  },
} as const;

// Admin addresses
export const ADMIN_ADDRESSES = {
  // Primary admin address
  PRIMARY: '0x21d654daab0fe1be0e584980ca7c1a382850939f',
  // Secondary admin address (if needed)
  SECONDARY: '0x7818CEd1298849B47a9B56066b5adc72CDDAf733',
} as const;

// OLD ADDRESSES (commented out for reference)
export const OLD_CONTRACT_ADDRESSES = {
  CELO: {
    PREDICTION_MARKET_CORE: '0x2D6614fe45da6Aa7e60077434129a51631AC702A',
    PREDICTION_MARKET_CLAIMS: '0xA8479E513D8643001285D9AF6277602B20676B95',
  },
} as const;

/**
 * Get the core contract address for a given chain ID
 */
export const getCoreContractAddress = (chainId?: number): `0x${string}` => {
  if (chainId === 42220) { // Celo Mainnet
    return (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO || CONTRACT_ADDRESSES.CELO.PREDICTION_MARKET_CORE) as `0x${string}`;
  } else if (chainId === 8453) { // Base Mainnet
    return (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_BASE || CONTRACT_ADDRESSES.BASE.PREDICTION_MARKET_CORE) as `0x${string}`;
  } else {
    // Default to Celo for mainnet
    return (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO || CONTRACT_ADDRESSES.CELO.PREDICTION_MARKET_CORE) as `0x${string}`;
  }
};

/**
 * Get the claims contract address for a given chain ID
 */
export const getClaimsContractAddress = (chainId?: number): `0x${string}` => {
  if (chainId === 42220) { // Celo Mainnet
    return (process.env.NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO || CONTRACT_ADDRESSES.CELO.PREDICTION_MARKET_CLAIMS) as `0x${string}`;
  } else if (chainId === 8453) { // Base Mainnet
    return (process.env.NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_BASE || CONTRACT_ADDRESSES.BASE.PREDICTION_MARKET_CLAIMS) as `0x${string}`;
  } else {
    // Default to Celo for mainnet
    return (process.env.NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO || CONTRACT_ADDRESSES.CELO.PREDICTION_MARKET_CLAIMS) as `0x${string}`;
  }
};

// Convenience exports for Celo mainnet (most commonly used)
export const CELO_CORE_ADDRESS = CONTRACT_ADDRESSES.CELO.PREDICTION_MARKET_CORE;
export const CELO_CLAIMS_ADDRESS = CONTRACT_ADDRESSES.CELO.PREDICTION_MARKET_CLAIMS;

/**
 * Check if an address is an admin
 */
export const isAdminAddress = (address?: string): boolean => {
  if (!address) return false;
  const lowerAddress = address.toLowerCase();
  return lowerAddress === ADMIN_ADDRESSES.PRIMARY.toLowerCase() || 
         lowerAddress === ADMIN_ADDRESSES.SECONDARY.toLowerCase();
};
