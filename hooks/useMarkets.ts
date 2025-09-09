import { useReadContract, useReadContracts } from 'wagmi';
import { PREDICTION_MARKET_CORE_ABI } from '@/contracts/contracts';
import { Market, MarketMetadata, MarketWithMetadata, MarketStatus } from '@/contracts/contracts';
import { useMemo, useState, useEffect } from 'react';
import { getCoreContractAddress } from '@/lib/contract-addresses';

export function useMarkets() {
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'volume' | 'ending'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Get market count
  const { data: marketCount, isLoading: countLoading, error: countError } = useReadContract({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI as any,
    functionName: 'getMarketCount',
    chainId: 42220 // Celo mainnet
  });

  // Get all market details - markets are 1-indexed!
  const { data: marketResults, isLoading: marketsLoading, error: marketsError } = useReadContracts({
    contracts: marketCount ? Array.from({ length: Number(marketCount) }, (_, i) => ({
      address: getCoreContractAddress(),
      abi: PREDICTION_MARKET_CORE_ABI as any,
      functionName: 'getMarket',
      args: [i + 1], // Markets are 1-indexed, not 0-indexed!
      chainId: 42220
    })) : []
  });

  // Get market metadata - markets are 1-indexed!
  const { data: metadataResults, isLoading: metadataLoading, error: metadataError } = useReadContracts({
    contracts: marketCount ? Array.from({ length: Number(marketCount) }, (_, i) => ({
      address: getCoreContractAddress(),
      abi: PREDICTION_MARKET_CORE_ABI as any,
      functionName: 'getMarketMetadata',
      args: [i + 1], // Markets are 1-indexed, not 0-indexed!
      chainId: 42220
    })) : []
  });

  // Process all markets
  const allMarkets: MarketWithMetadata[] = useMemo(() => {
    if (!marketResults || !metadataResults) {
      return [];
    }
    
    const processedMarkets = marketResults.map((result, index) => {
      if (result.status === 'success' && result.result && metadataResults[index]?.status === 'success') {
        // The result is a struct, so we access it directly
        const market = result.result as any;
        const metadata = metadataResults[index].result as any;
        
        return {
          id: market.id || BigInt(0),
          question: market.question || '',
          endTime: market.endTime || BigInt(0),
          totalPool: market.totalPool || BigInt(0),
          totalYes: market.totalYes || BigInt(0),
          totalNo: market.totalNo || BigInt(0),
          status: market.status || 0,
          outcome: market.outcome || false,
          createdAt: market.createdAt || BigInt(0),
          creator: market.creator || '0x0',
          description: metadata.description || '',
          category: metadata.category || '',
          image: metadata.image || '',
          source: metadata.source || ''
        };
      }
      return null;
    }).filter(Boolean) as MarketWithMetadata[];
    
    return processedMarkets;
  }, [marketResults, metadataResults]);

  // Filter and sort markets
  const { filteredMarkets, totalMarkets } = useMemo(() => {
    let filtered = allMarkets.filter(market => {
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          market.question.toLowerCase().includes(searchLower) ||
          market.description.toLowerCase().includes(searchLower) ||
          market.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filter by category
      if (selectedCategory && selectedCategory !== '' && selectedCategory !== 'all') {
        if (market.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      return true;
    });

    // Sort markets
    filtered.sort((a, b) => {
      const currentTime = Math.floor(Date.now() / 1000);
      
      switch (sortBy) {
        case 'newest':
          return Number(b.createdAt) - Number(a.createdAt);
        case 'oldest':
          return Number(a.createdAt) - Number(b.createdAt);
        case 'volume':
          return Number(b.totalPool) - Number(a.totalPool);
        case 'ending':
          return Number(a.endTime) - Number(b.endTime);
        default:
          return Number(b.createdAt) - Number(a.createdAt);
      }
    });


    return {
      filteredMarkets: filtered,
      totalMarkets: allMarkets.length // Use actual market count, not filtered count
    };
  }, [allMarkets, searchTerm, selectedCategory, sortBy]);

  // Paginate markets
  const markets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMarkets.slice(startIndex, endIndex);
  }, [filteredMarkets, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredMarkets.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Categories for filtering
  const categories = useMemo(() => {
    const categorySet = new Set(allMarkets.map(market => market.category).filter(Boolean));
    const categoryList = Array.from(categorySet).map(category => ({
      id: category.toLowerCase(),
      name: category,
      color: getCategoryColor(category)
    }));
    
    return [
      { id: 'all', name: 'All Markets', color: '#6B7280' },
      ...categoryList
    ];
  }, [allMarkets]);

  // Helper function to get category color
  function getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Politics': '#EF4444',
      'Sports': '#10B981',
      'Technology': '#3B82F6',
      'Entertainment': '#8B5CF6',
      'Finance': '#F59E0B',
      'Science': '#6366F1',
      'Weather': '#06B6D4',
      
      'Other': '#6B7280'
    };
    return colors[category] || colors['Other'];
  }

  // Refetch function
  const refetchMarkets = () => {
    // This would trigger a refetch if we had a refetch function
    // For now, we'll just reset the page
    setCurrentPage(1);
  };

  return {
    markets,
    allMarkets,
    loading: countLoading || marketsLoading || metadataLoading,
    error: countError || marketsError || metadataError,
    currentPage,
    totalPages,
    searchTerm,
    selectedCategory,
    sortBy,
    categories,
    setSearchTerm,
    setSelectedCategory,
    setSortBy,
    setCurrentPage,
    refetchMarkets,
    totalMarkets,
    hasNextPage,
    hasPrevPage
  };
}

export function useMarket(marketId: number) {
  const { data: market, isLoading: marketLoading, error: marketError } = useReadContract({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)], // marketId should already be 1-indexed when passed in
    chainId: 42220
  });

  const { data: metadata, isLoading: metadataLoading, error: metadataError } = useReadContract({
    address: getCoreContractAddress(),
    abi: PREDICTION_MARKET_CORE_ABI,
    functionName: 'getMarketMetadata',
    args: [BigInt(marketId)], // marketId should already be 1-indexed when passed in
    chainId: 42220
  });

  const marketWithMetadata: MarketWithMetadata | null = useMemo(() => {
    if (!market || !metadata) return null;
    
    const marketData = market as any;
    const metadataData = metadata as any;
    
    return {
      id: marketData.id || BigInt(0),
      question: marketData.question || '',
      endTime: marketData.endTime || BigInt(0),
      totalPool: marketData.totalPool || BigInt(0),
      totalYes: marketData.totalYes || BigInt(0),
      totalNo: marketData.totalNo || BigInt(0),
      status: marketData.status || 0,
      outcome: marketData.outcome || false,
      createdAt: marketData.createdAt || BigInt(0),
      creator: marketData.creator || '0x0',
      description: metadataData.description || '',
      category: metadataData.category || '',
      image: metadataData.image || '',
      source: metadataData.source || ''
    };
  }, [market, metadata]);

  return {
    market: marketWithMetadata,
    isLoading: marketLoading || metadataLoading,
    error: marketError || metadataError
  };
}

export function useMarketsByStatus(status: MarketStatus) {
  const { markets, loading, error } = useMarkets();
  
  const filteredMarkets = useMemo(() => {
    return markets.filter(market => market.status === status);
  }, [markets, status]);

  return {
    markets: filteredMarkets,
    loading,
    error
  };
}

export function useMarketsByCategory(category: string) {
  const { markets, loading, error } = useMarkets();
  
  const filteredMarkets = useMemo(() => {
    return markets.filter(market => market.category.toLowerCase() === category.toLowerCase());
  }, [markets, category]);

  return {
    markets: filteredMarkets,
    loading,
    error
  };
}
