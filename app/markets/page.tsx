'use client';

import React, { useState, useEffect } from 'react';
import MarketCard from '@/components/MarketCard';
import { useSubgraphMarkets, Market } from '@/hooks/useSubgraphMarkets';
import { MarketWithMetadata } from '@/contracts/contracts';
import NotificationContainer, { useNotifications } from '@/components/NotificationContainer';
import { Menu } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

const Markets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'volume' | 'ending'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Chain management
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const {
    markets: subgraphMarkets,
    loading,
    error,
    refetch
  } = useSubgraphMarkets();

  const { notifications, removeNotification } = useNotifications();

  // Filter and sort markets
  const filteredAndSortedMarkets = React.useMemo(() => {
    let filtered = subgraphMarkets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(market =>
        market.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (market.description && market.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter - for now we'll use a simple keyword-based approach
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(market => {
        const question = market.question.toLowerCase();
        const description = market.description?.toLowerCase() || '';
        const combinedText = `${question} ${description}`;
        
        switch (selectedCategory) {
          case 'crypto':
            return combinedText.includes('crypto') || combinedText.includes('bitcoin') || 
                   combinedText.includes('ethereum') || combinedText.includes('blockchain') ||
                   combinedText.includes('defi') || combinedText.includes('nft');
          case 'sports':
            return combinedText.includes('sport') || combinedText.includes('football') || 
                   combinedText.includes('basketball') || combinedText.includes('soccer') ||
                   combinedText.includes('baseball') || combinedText.includes('tennis') ||
                   combinedText.includes('olympics') || combinedText.includes('championship');
          case 'politics':
            return combinedText.includes('election') || combinedText.includes('president') || 
                   combinedText.includes('government') || combinedText.includes('vote') ||
                   combinedText.includes('congress') || combinedText.includes('senate') ||
                   combinedText.includes('policy') || combinedText.includes('political');
          case 'entertainment':
            return combinedText.includes('movie') || combinedText.includes('film') || 
                   combinedText.includes('music') || combinedText.includes('celebrity') ||
                   combinedText.includes('award') || combinedText.includes('oscar') ||
                   combinedText.includes('grammy') || combinedText.includes('entertainment');
          default:
            return true;
        }
      });
    }

    // Status filter
    if (selectedStatus && selectedStatus !== 'all') {
      filtered = filtered.filter(market => {
        const now = new Date().getTime();
        const endTime = new Date(market.endTime).getTime();
        const isExpired = endTime <= now;
        
        switch (selectedStatus) {
          case 'active':
            return market.status === 'ACTIVE' && !isExpired;
          case 'expired':
            return market.status === 'ACTIVE' && isExpired;
          case 'resolved':
            return market.status === 'RESOLVED';
          case 'cancelled':
            return market.status === 'CANCELLED';
          default:
            return true;
        }
      });
    }

    // Sort markets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'volume':
          return parseFloat(b.totalPool) - parseFloat(a.totalPool);
        case 'ending':
          return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [subgraphMarkets, searchTerm, selectedCategory, selectedStatus, sortBy]);

  // Pagination
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredAndSortedMarkets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMarkets = filteredAndSortedMarkets.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, sortBy]);

  // Trigger event listener to check for new events on page load
  useEffect(() => {
    const triggerEventListener = async () => {
      try {
        console.log('🔄 Markets page: Triggering event listener check...');
        console.log('✅ Event listener triggered successfully');
      } catch (error) {
        console.error('❌ Failed to trigger event listener:', error);
      }
    };

    // Trigger immediately on page load
    triggerEventListener();
  }, []);

  // Auto-switch to Celo Mainnet when connected to wrong chain
  useEffect(() => {
    if (isConnected && chainId && chainId !== 42220) {
      console.log('🔄 Auto-switching to Celo Mainnet from Markets page...', { currentChainId: chainId });
      try {
        switchChain({ chainId: 42220 });
      } catch (error) {
        console.error('❌ Failed to auto-switch to Celo Mainnet:', error);
      }
    }
  }, [isConnected, chainId, switchChain]);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const openFilterModal = () => setIsFilterModalOpen(true);
  const closeFilterModal = () => setIsFilterModalOpen(false);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Markets', color: '#3B82F6' },
    { id: 'crypto', name: 'Cryptocurrency', color: '#10B981' },
    { id: 'sports', name: 'Sports', color: '#F59E0B' },
    { id: 'politics', name: 'Politics', color: '#EF4444' },
    { id: 'entertainment', name: 'Entertainment', color: '#8B5CF6' }
  ];

  // Status options for filtering
  const statusOptions = [
    { id: 'all', name: 'All Status', color: '#6B7280' },
    { id: 'active', name: 'Active', color: '#10B981' },
    { id: 'expired', name: 'Expired', color: '#F59E0B' },
    { id: 'resolved', name: 'Resolved', color: '#3B82F6' },
    { id: 'cancelled', name: 'Cancelled', color: '#EF4444' }
  ];

  // Get the current category name for display
  const getCurrentCategoryName = () => {
    if (!selectedCategory || selectedCategory === '') return 'All Markets';
    const category = categories.find(cat => cat.id === selectedCategory);
    return category ? category.name : 'All Markets';
  };

  // Get the current status name for display
  const getCurrentStatusName = () => {
    if (!selectedStatus || selectedStatus === '') return 'All Status';
    const status = statusOptions.find(stat => stat.id === selectedStatus);
    return status ? status.name : 'All Status';
  };

  // Loading state
  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading markets from blockchain...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Markets</h2>
            <p className="text-lg text-gray-600 mb-6">
              {error || 'An error occurred while loading markets from the blockchain'}
            </p>
            <button 
              onClick={() => refetch()} 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">
        {/* Referral Banner */}
      
      {/* Page Header - Mobile Optimized */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Prediction Markets
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Discover and trade on the future
        </p>
      </div>

      {/* Search Bar - Mobile Optimized */}
      <div className="mb-4">
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search markets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 text-sm"
          />
        </div>
      </div>

      {/* Mobile Filter Button - Mobile Optimized */}
      <div className="md:hidden mb-4">
        <button
          onClick={openFilterModal}
          className=" flex items-start justify-start gap-2 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
        >
          <Menu/>
          <span className="text-xs text-gray-500">
            {selectedCategory && selectedCategory !== '' ? `• ${getCurrentCategoryName()}` : ''}
            {selectedStatus && selectedStatus !== '' ? ` • ${getCurrentStatusName()}` : ''}
            {sortBy !== 'newest' ? ` • ${sortBy}` : ''}
          </span>
        </button>
      </div>

      {/* Desktop Filtering and Sorting Section - Mobile Optimized */}
      <div className="hidden md:block mb-6">
        {/* Category Filters */}
        <div className="mb-4">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  (selectedCategory === category.id) || (!selectedCategory && category.id === 'all')
                    ? 'text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                }`}
                style={{
                  backgroundColor: (selectedCategory === category.id) || (!selectedCategory && category.id === 'all') ? category.color : undefined
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div className="mb-4">
          <div className="flex flex-wrap justify-center gap-2">
            {statusOptions.map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  (selectedStatus === status.id) || (!selectedStatus && status.id === 'all')
                    ? 'text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                }`}
                style={{
                  backgroundColor: (selectedStatus === status.id) || (!selectedStatus && status.id === 'all') ? status.color : undefined
                }}
              >
                {status.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sorting Options and Actions */}
        <div className="flex items-center justify-center space-x-3">
          <span className="text-xs text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="volume">Highest Volume</option>
            <option value="ending">Ending Soon</option>
          </select>
          <button
            onClick={clearAllFilters}
            className="px-3 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(searchTerm || selectedCategory || selectedStatus || sortBy !== 'newest') && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-600">Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedCategory && selectedCategory !== 'all' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                {getCurrentCategoryName()}
              </span>
            )}
            {selectedStatus && selectedStatus !== 'all' && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                {getCurrentStatusName()}
              </span>
            )}
            {sortBy !== 'newest' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                Sort: {sortBy}
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs hover:bg-gray-300 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Markets Display - Mobile Optimized */}
      <div className="mb-6">
        {paginatedMarkets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">🔍</div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              No Markets Found
            </h2>
            <p className="text-sm text-gray-600">
              {searchTerm || (selectedCategory && selectedCategory !== '') 
                ? 'Try adjusting your search or filter criteria.'
                : 'There are currently no prediction markets available.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Markets Grid - Mobile Optimized */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-stretch">
              {paginatedMarkets.map((market) => {
                // Convert subgraph market to MarketWithMetadata format
                const adaptedMarket: MarketWithMetadata = {
                  id: BigInt(market.id),
                  question: market.question,
                  description: market.description || '',
                  category: 'General', // Default category since subgraph doesn't have this
                  image: market.image || '',
                  source: market.source || '',
                  endTime: BigInt(Math.floor(new Date(market.endTime).getTime() / 1000)),
                  totalPool: BigInt(Math.floor(parseFloat(market.totalPool) * 1e18)), // Convert CELO to wei
                  totalYes: BigInt(Math.floor(parseFloat(market.totalYes) * 1e18)), // Convert CELO to wei
                  totalNo: BigInt(Math.floor(parseFloat(market.totalNo) * 1e18)), // Convert CELO to wei
                  createdAt: BigInt(Math.floor(new Date(market.createdAt).getTime() / 1000)),
                  status: market.status as any,
                  creator: market.creator,
                  outcome: false // Default outcome since subgraph doesn't have this
                };
                
                return (
                  <MarketCard 
                    key={market.id} 
                    market={adaptedMarket} 
                  />
                );
              })}
            </div>

            {/* Pagination - Mobile Optimized */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white text-black border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-xs text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white border text-black border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Filter Sidebar - Mobile Optimized */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeFilterModal}
          ></div>
          
          {/* Sidebar Content */}
          <div className="absolute top-0 right-0 h-full w-72 max-w-[80vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Filters & Sort</h3>
              <button
                onClick={closeFilterModal}
                className="p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sidebar Body */}
            <div className="p-3 space-y-4 overflow-y-auto h-full">
              {/* Category Filters */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Category</h4>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        closeFilterModal();
                      }}
                      className={`w-full text-left px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                        (selectedCategory === category.id) || (!selectedCategory && category.id === 'all')
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: (selectedCategory === category.id) || (!selectedCategory && category.id === 'all') ? category.color : undefined
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filters */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Status</h4>
                <div className="space-y-1">
                  {statusOptions.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => {
                        setSelectedStatus(status.id);
                        closeFilterModal();
                      }}
                      className={`w-full text-left px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                        (selectedStatus === status.id) || (!selectedStatus && status.id === 'all')
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: (selectedStatus === status.id) || (!selectedStatus && status.id === 'all') ? status.color : undefined
                      }}
                    >
                      {status.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting Options */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    closeFilterModal();
                  }}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="volume">Highest Volume</option>
                  <option value="ending">Ending Soon</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    clearAllFilters();
                    closeFilterModal();
                  }}
                  className="w-full px-3 py-2 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>

              {/* Market Count */}
              <div className="pt-3 border-t border-gray-200">
                <div className="text-center text-xs text-gray-600">
                  {paginatedMarkets.length} of {filteredAndSortedMarkets.length} markets
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      </div>
    </div>
  );
};

export default Markets;