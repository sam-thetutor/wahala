import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency values
 */
export function formatCurrency(
  value: number | string,
  currency: string = 'CELO',
  decimals: number = 2
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return `0 ${currency}`;
  
  if (numValue >= 1e9) {
    return `${(numValue / 1e9).toFixed(decimals)}B ${currency}`;
  } else if (numValue >= 1e6) {
    return `${(numValue / 1e6).toFixed(decimals)}M ${currency}`;
  } else if (numValue >= 1e3) {
    return `${(numValue / 1e3).toFixed(decimals)}K ${currency}`;
  } else {
    return `${numValue.toFixed(decimals)} ${currency}`;
  }
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  return numValue.toLocaleString('en-US');
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Ended';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Get contrast color (black or white) for a given background color
 */
export function getContrastColor(hexColor: string): 'black' | 'white' {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Sleep function for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format volume values
 */
export function formatVolume(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0.00';
  
  if (numValue >= 1e9) {
    return `${(numValue / 1e9).toFixed(2)}B`;
  } else if (numValue >= 1e6) {
    return `${(numValue / 1e6).toFixed(2)}M`;
  } else if (numValue >= 1e3) {
    return `${(numValue / 1e3).toFixed(2)}K`;
  } else {
    return numValue.toFixed(2);
  }
}

/**
 * Calculate potential return based on smart contract logic
 * @param userShares - Amount of shares the user is buying
 * @param totalWinningShares - Total shares on the winning side
 * @param totalLosingShares - Total shares on the losing side
 * @param creatorFeePercentage - Creator fee percentage (default 15%)
 * @returns Object with potential return details
 */
export function calculatePotentialReturn(
  userShares: number,
  totalWinningShares: number,
  totalLosingShares: number,
  creatorFeePercentage: number = 15
): {
  potentialReturn: number;
  returnPercentage: number;
  breakdown: {
    originalStake: number;
    winningsFromLosers: number;
    creatorFee: number;
    platformFee: number;
    totalWinnings: number;
  };
} {
  // If no shares, return zero
  if (userShares <= 0 || totalWinningShares <= 0) {
    return {
      potentialReturn: 0,
      returnPercentage: 0,
      breakdown: {
        originalStake: 0,
        winningsFromLosers: 0,
        creatorFee: 0,
        platformFee: 0,
        totalWinnings: 0,
      },
    };
  }

  // If no losing shares, user just gets their stake back (no additional winnings)
  if (totalLosingShares <= 0) {
    return {
      potentialReturn: userShares,
      returnPercentage: 0,
      breakdown: {
        originalStake: userShares,
        winningsFromLosers: 0,
        creatorFee: 0,
        platformFee: 0,
        totalWinnings: userShares,
      },
    };
  }

  // Calculate fees from losing shares
  const creatorFee = (totalLosingShares * creatorFeePercentage) / 100;
  const platformFee = (totalLosingShares * 15) / 100; // 15% platform fee (hardcoded in contract)
  const winningsFromLosers = totalLosingShares - creatorFee - platformFee;

  // Total amount available to winners = winning shares + winnings from losers
  const totalWinnerAmount = totalWinningShares + winningsFromLosers;

  // User's share of the total winnings
  const userWinnings = (totalWinnerAmount * userShares) / totalWinningShares;
  const userWinningsFromLosers = (winningsFromLosers * userShares) / totalWinningShares;

  // Calculate return percentage
  const returnPercentage = ((userWinnings - userShares) / userShares) * 100;

  return {
    potentialReturn: userWinnings,
    returnPercentage: returnPercentage,
    breakdown: {
      originalStake: userShares,
      winningsFromLosers: userWinningsFromLosers,
      creatorFee: (creatorFee * userShares) / totalWinningShares,
      platformFee: (platformFee * userShares) / totalWinningShares,
      totalWinnings: userWinnings,
    },
  };
}

/**
 * Format date values
 */
export function formatDate(timestamp: string | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Shorten wallet address
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}