'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePredictionMarket } from '@/hooks/usePredictionMarket';
import { useSubgraphMarkets } from '@/hooks/useSubgraphMarkets';
import { useNotifications } from '@/components/NotificationContainer';
import NotificationContainer from '@/components/NotificationContainer';
import { MarketStatus } from '@/contracts/contracts';
import { formatEther } from 'viem';
import { 
  Shield, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { isAdminAddress } from '@/lib/contract-addresses';

const Admin: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { markets: allMarkets, loading, error, refetch } = useSubgraphMarkets();
  const { resolveMarket, contractState } = usePredictionMarket();
  const { addNotification, notifications, removeNotification } = useNotifications();
  
  const [resolvingMarketId, setResolvingMarketId] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  // Check if current user is admin
  const isAdmin = isAdminAddress(address);

  useEffect(() => {
    if (isAdmin) {
      refetch();
    }
  }, [isAdmin, refetch]);

  const handleResolveMarket = async (marketId: string, outcome: boolean) => {
    if (!isAdmin) {
      addNotification({
        type: 'error',
        title: 'Access Denied',
        message: 'Only admin can resolve markets',
        duration: 5000
      });
      return;
    }

    try {
      setResolvingMarketId(marketId);
      const result = await resolveMarket({ marketId: parseInt(marketId), outcome });
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Market Resolved',
          message: `Market resolved successfully! Outcome: ${outcome ? 'YES' : 'NO'}`,
          duration: 5000
        });
        
        // Refresh markets after resolution
        setTimeout(() => {
          refetch();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to resolve market');
      }
    } catch (err) {
      console.error('Error resolving market:', err);
      addNotification({
        type: 'error',
        title: 'Resolution Failed',
        message: 'Failed to resolve market. Please try again.',
        duration: 7000
      });
    } finally {
      setResolvingMarketId(null);
      setSelectedOutcome(null);
    }
  };

  const getStatusText = (status: string, endTime: string) => {
    const now = Math.floor(Date.now() / 1000);
    const isExpired = new Date(endTime).getTime() / 1000 <= now;
    
    if (status === 'RESOLVED') return 'Resolved';
    if (status === 'CANCELLED') return 'Cancelled';
    if (isExpired) return 'Expired';
    return 'Active';
  };

  const getStatusColor = (status: string, endTime: string) => {
    const now = Math.floor(Date.now() / 1000);
    const isExpired = new Date(endTime).getTime() / 1000 <= now;
    
    if (status === 'RESOLVED') return 'bg-green-100 text-green-800';
    if (status === 'CANCELLED') return 'bg-red-100 text-red-800';
    if (isExpired) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusIcon = (status: string, endTime: string) => {
    const now = Math.floor(Date.now() / 1000);
    const isExpired = new Date(endTime).getTime() / 1000 <= now;
    
    if (status === 'RESOLVED') return <CheckCircle className="w-4 h-4" />;
    if (status === 'CANCELLED') return <XCircle className="w-4 h-4" />;
    if (isExpired) return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatPool = (amount: string) => {
    return parseFloat(amount).toFixed(4);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <Shield className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Wallet Not Connected
            </h2>
            <p className="text-yellow-700">
              Please connect your wallet to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h2>
            <p className="text-red-700 mb-2">
              Only the admin can access this page.
            </p>
            <p className="text-sm text-red-600">
              Admin address: {address || 'Not connected'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Loading Markets...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error Loading Markets
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter markets based on status and time
  const now = Math.floor(Date.now() / 1000);
  const expiredMarkets = allMarkets.filter(market => {
    const endTime = new Date(market.endTime).getTime() / 1000;
    return market.status === 'ACTIVE' && endTime <= now;
  });

  const activeMarkets = allMarkets.filter(market => {
    const endTime = new Date(market.endTime).getTime() / 1000;
    return market.status === 'ACTIVE' && endTime > now;
  });

  const resolvedMarkets = allMarkets.filter(market => market.status === 'RESOLVED');
  const cancelledMarkets = allMarkets.filter(market => market.status === 'CANCELLED');

  // Calculate total volume
  const totalVolume = allMarkets.reduce((sum, market) => sum + parseFloat(market.totalPool || '0'), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <p className="text-lg text-gray-600">
              Manage prediction markets and resolve expired ones
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{allMarkets.length}</div>
              <div className="text-sm text-gray-600">Total Markets</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{activeMarkets.length}</div>
              <div className="text-sm text-gray-600">Active Markets</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">{expiredMarkets.length}</div>
              <div className="text-sm text-gray-600">Expired Markets</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">{resolvedMarkets.length}</div>
              <div className="text-sm text-gray-600">Resolved Markets</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-2xl font-bold text-indigo-600">{totalVolume.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Volume (CELO)</div>
            </div>
          </div>

          {/* Expired Markets Section */}
          {expiredMarkets.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Expired Markets - Need Resolution ({expiredMarkets.length})
                </h2>
              </div>
              <div className="space-y-4">
                {expiredMarkets.map((market) => (
                  <div key={market.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">{market.question}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Category:</span> General
                          </div>
                          <div>
                            <span className="font-medium">Ended:</span> {formatTime(market.endTime)}
                          </div>
                          <div>
                            <span className="font-medium">Total Pool:</span> {formatPool(market.totalPool || '0')} CELO
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => {
                            setSelectedOutcome(true);
                            handleResolveMarket(market.id, true);
                          }}
                          disabled={contractState.isLoading || resolvingMarketId === market.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {resolvingMarketId === market.id && selectedOutcome === true ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Resolving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Resolve YES
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOutcome(false);
                            handleResolveMarket(market.id, false);
                          }}
                          disabled={contractState.isLoading || resolvingMarketId === market.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {resolvingMarketId === market.id && selectedOutcome === false ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Resolving...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Resolve NO
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Markets Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                All Markets ({allMarkets.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResolved(!showResolved)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  {showResolved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showResolved ? 'Hide' : 'Show'} Resolved
                </button>
                <button
                  onClick={refetch}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Pool
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allMarkets
                    .filter(market => showResolved || market.status !== 'RESOLVED')
                    .map((market) => {
                      const endTime = new Date(market.endTime).getTime() / 1000;
                      const isExpired = market.status === 'ACTIVE' && endTime <= now;
                      
                      return (
                        <tr key={market.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="max-w-xs">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {market.question}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {market.description || 'No description'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              General
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${getStatusColor(market.status, market.endTime)}`}>
                              {getStatusIcon(market.status, market.endTime)}
                              {getStatusText(market.status, market.endTime)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(market.endTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPool(market.totalPool || '0')} CELO
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {isExpired ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleResolveMarket(market.id, true)}
                                  disabled={contractState.isLoading || resolvingMarketId === market.id}
                                  className="text-green-600 hover:text-green-900 disabled:text-green-400 disabled:cursor-not-allowed text-xs"
                                >
                                  Resolve YES
                                </button>
                                <button
                                  onClick={() => handleResolveMarket(market.id, false)}
                                  disabled={contractState.isLoading || resolvingMarketId === market.id}
                                  className="text-red-600 hover:text-red-900 disabled:text-red-400 disabled:cursor-not-allowed text-xs"
                                >
                                  Resolve NO
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">No actions</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </div>
  );
};

export default Admin;
