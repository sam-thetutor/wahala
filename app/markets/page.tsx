'use client';

import React, { useState, useEffect } from 'react';
import MarketCard from '@/components/MarketCard';
import { useMarketsApi } from '@/hooks/useMarketsApi';
import { MarketWithMetadata } from '@/contracts/contracts';
import ReferralBanner from '@/components/ReferralBanner';
import NotificationContainer, { useNotifications } from '@/components/NotificationContainer';

const Markets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'volume' | 'ending'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    markets,
    categories,
    pagination,
    loading,
    error,
    refetch
  } = useMarketsApi({
    page: currentPage,
    limit: 12,
    search: searchTerm,
    category: selectedCategory,
    sortBy
  });

  const { notifications, removeNotification } = useNotifications();

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

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const openFilterModal = () => setIsFilterModalOpen(true);
  const closeFilterModal = () => setIsFilterModalOpen(false);

  // Get the current category name for display
  const getCurrentCategoryName = () => {
    if (!selectedCategory || selectedCategory === '') return 'All Markets';
    const category = categories.find(cat => cat.id === selectedCategory);
    return category ? category.name : 'All Markets';
  };

  // Loading state
  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading markets...</p>
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
              {error?.message || 'An error occurred while loading markets'}
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
        <ReferralBanner />
      
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
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          <span>Filters & Sort</span>
          <span className="text-xs text-gray-500">
            {selectedCategory && selectedCategory !== '' ? `• ${getCurrentCategoryName()}` : ''}
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

        {/* Sorting Options */}
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
        </div>
      </div>

      {/* Markets Display - Mobile Optimized */}
      <div className="mb-6">
        {markets.length === 0 ? (
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
              {markets.map((market) => {
                // Handle both numeric and string IDs safely
                const marketId = market.id.startsWith('market_') 
                  ? market.id.replace('market_', '') 
                  : market.id;
                
                // Safe BigInt conversion with fallbacks
                const safeBigInt = (value: string, fallback: string = '0') => {
                  try {
                    // Check if value is a valid number
                    if (isNaN(Number(value)) || value.includes(':')) {
                      console.warn(`Invalid BigInt value: ${value}, using fallback: ${fallback}`);
                      return BigInt(fallback);
                    }
                    return BigInt(value);
                  } catch (error) {
                    console.warn(`BigInt conversion failed for: ${value}, using fallback: ${fallback}`);
                    return BigInt(fallback);
                  }
                };
                
                const adaptedMarket: MarketWithMetadata = {
                  ...market,
                  id: safeBigInt(marketId),
                  endTime: safeBigInt(market.endtime),
                  totalPool: safeBigInt(market.totalpool),
                  totalYes: safeBigInt(market.totalyes),
                  totalNo: safeBigInt(market.totalno),
                  createdAt: safeBigInt(market.createdat),
                  status: market.status as any // Convert number to MarketStatus enum
                };
                return (
                  <MarketCard 
                    key={market.id.toString()} 
                    market={adaptedMarket} 
                  />
                );
              })}
            </div>

            {/* Pagination - Mobile Optimized */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-2 bg-white text-black border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-xs text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
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

              {/* Market Count */}
              <div className="pt-3 border-t border-gray-200">
                <div className="text-center text-xs text-gray-600">
                  {markets.length} of {pagination.totalMarkets} markets
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
