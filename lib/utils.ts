// Utility functions for formatting and display

export function formatVolume(volume: string | number): string {
  const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume;
  
  // Convert from wei to CELO if the number is very large
  const celoVolume = numVolume > 1e15 ? numVolume / 1e18 : numVolume;
  
  if (celoVolume >= 1e12) {
    return `${(celoVolume / 1e12).toFixed(1)}T CELO`;
  } else if (celoVolume >= 1e9) {
    return `${(celoVolume / 1e9).toFixed(1)}B CELO`;
  } else if (celoVolume >= 1e6) {
    return `${(celoVolume / 1e6).toFixed(1)}M CELO`;
  } else if (celoVolume >= 1e3) {
    return `${(celoVolume / 1e3).toFixed(1)}K CELO`;
  } else if (celoVolume >= 1) {
    return `${celoVolume.toFixed(2)} CELO`;
  } else if (celoVolume >= 0.01) {
    return `${celoVolume.toFixed(4)} CELO`;
  } else {
    return `${celoVolume.toFixed(6)} CELO`;
  }
}

export function formatDate(timestamp: number | string): string {
  const date = typeof timestamp === 'string' ? new Date(parseInt(timestamp) * 1000) : new Date(timestamp * 1000);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  } else {
    return value.toFixed(0);
  }
}
