/**
 * Central configuration for contract addresses
 * This file serves as the single source of truth for all contract addresses
 */


// New deployed contract addresses
export const CONTRACT_ADDRESSES = {
  // Celo Mainnet
  CELO: {
    PREDICTION_MARKET_CORE: '0x7176D16D61A122231a78749c61740ad8F86BB13a',
    PREDICTION_MARKET_CLAIMS: '0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6',
  },
  // Base Mainnet
  BASE: {
    PREDICTION_MARKET_CORE: '0x0000000000000000000000000000000000000000',
    PREDICTION_MARKET_CLAIMS: '0x0000000000000000000000000000000000000000',
  },
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
