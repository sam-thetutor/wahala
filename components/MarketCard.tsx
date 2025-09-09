'use client';

import React from 'react';
import Link from 'next/link';
import { MarketWithMetadata } from '@/contracts/contracts';
import { formatEther } from 'viem';
import { Clock, Users, TrendingUp, Calendar } from 'lucide-react';

interface MarketCardProps {
  market: MarketWithMetadata;
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const endTime = Number(market.endTime);
  const isEnded = endTime <= currentTime;
  const timeRemaining = endTime - currentTime;
  
  // Calculate time remaining in a readable format
  const getTimeRemaining = () => {
    if (isEnded) return 'Ended';
    
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Calculate YES percentage
  const totalPool = Number(formatEther(market.totalPool));
  const totalYes = Number(formatEther(market.totalYes));
  const totalNo = Number(formatEther(market.totalNo));
  const totalShares = totalYes + totalNo;
  const yesPercentage = totalShares > 0 ? (totalYes / totalShares) * 100 : 50;

  // Get status color
  const getStatusColor = () => {
    if (isEnded) return 'bg-gray-500';
    if (timeRemaining < 3600) return 'bg-red-500'; // Less than 1 hour
    if (timeRemaining < 86400) return 'bg-yellow-500'; // Less than 1 day
    return 'bg-green-500';
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Politics': 'bg-red-100 text-red-800',
      'Sports': 'bg-green-100 text-green-800',
      'Technology': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Finance': 'bg-yellow-100 text-yellow-800',
      'Science': 'bg-indigo-100 text-indigo-800',
      'Weather': 'bg-cyan-100 text-cyan-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Other'];
  };

  return (
    <Link href={`/market/${market.id}`} className="block h-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden h-full flex flex-col">
        {/* Market Image - Mobile Optimized */}
        <div className="relative h-24 md:h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          {market.image && market.image !== '' ? (
            <img 
              src={market.image} 
              alt={market.question}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          )}
          
          {/* Status Badge - Mobile Optimized */}
          <div className={`absolute top-1 right-1 md:top-2 md:right-2 px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}>
            {isEnded ? 'Ended' : getTimeRemaining()}
          </div>
        </div>

        {/* Market Content - Mobile Optimized */}
        <div className="p-3 md:p-4 flex flex-col flex-1">
          {/* Category */}
          <div className="mb-1.5 md:mb-2">
            <span className={`inline-block px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs font-medium ${getCategoryColor(market.category)}`}>
              {market.category}
            </span>
          </div>

          {/* Question - Mobile Optimized */}
          <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-1.5 md:mb-2 line-clamp-2">
            {market.question}
          </h3>

          {/* Description - Mobile Optimized */}
          <p className="text-xs text-gray-600 mb-2 md:mb-3 line-clamp-1">
            {market.description}
          </p>

          {/* Market Stats - Mobile Optimized */}
          <div className="space-y-1.5 md:space-y-2 mt-auto">
            {/* YES/NO Pool */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">YES</span>
                <span className="font-medium text-gray-900">{yesPercentage.toFixed(1)}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">NO</span>
                <span className="font-medium text-gray-900">{(100 - yesPercentage).toFixed(1)}%</span>
              </div>
            </div>

            {/* Total Pool */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Pool</span>
              </div>
              <span className="font-medium text-gray-900">{totalPool.toFixed(2)} CELO</span>
            </div>

            {/* End Time */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Ends</span>
              </div>
              <span className="font-medium text-gray-900">
                {new Date(endTime * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MarketCard;
