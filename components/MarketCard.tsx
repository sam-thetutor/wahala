'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MarketWithMetadata } from '@/contracts/contracts';
import { formatEther } from 'viem';
import { Clock, Users, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Typography, Body, BodySmall, Caption } from '@/components/ui/Typography';
import { formatTimeRemaining, formatCurrency, formatPercentage } from '@/lib/utils';

interface MarketCardProps {
  market: MarketWithMetadata;
  className?: string;
}

const MarketCard: React.FC<MarketCardProps> = ({ market, className }) => {
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const endTime = Number(market.endTime);
  const isEnded = endTime <= currentTime;
  const timeRemaining = endTime - currentTime;

  // Update time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  
  // Calculate market statistics
  const totalPool = Number(formatEther(market.totalPool));
  const totalYes = Number(formatEther(market.totalYes));
  const totalNo = Number(formatEther(market.totalNo));
  const totalShares = totalYes + totalNo;
  const yesPercentage = totalShares > 0 ? (totalYes / totalShares) * 100 : 50;
  
  // Calculate dash value for semicircle
  const dashValue = (yesPercentage / 100) * 50;
  
  
  // Get status badge variant
  const getStatusVariant = () => {
    if (isEnded) return 'market-ended';
    if (timeRemaining < 3600) return 'warning'; // Less than 1 hour
    if (timeRemaining < 86400) return 'pending'; // Less than 1 day
    return 'market-active';
  };
  
  // Get category badge variant
  const getCategoryVariant = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'Politics': 'politics',
      'Sports': 'sports',
      'Technology': 'technology',
      'Entertainment': 'entertainment',
      'Finance': 'finance',
      'Science': 'science',
      'Weather': 'weather',
    };
    return categoryMap[category] || 'general';
  };

  return (
    <Link href={`/market/${market.id}`} className="block h-full">
      <div className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 p-4 ${className}`}>
        {/* First Row - Question and Circular Progress */}
        <div className="flex items-start justify-between mb-3">
          {/* Question with Icon */}
          <div className="flex items-start flex-1 min-w-0 mr-3">
            <span className="text-blue-500 mr-2 text-lg flex-shrink-0 mt-0.5">💎</span>
            <h3 className="text-sm font-medium text-gray-900 leading-tight break-words">
              {market.question}
            </h3>
          </div>

          {/* Semicircle Progress Indicator */}
          <div className="flex-shrink-0">
            <div className="relative w-12 h-6">
              <svg className="w-12 h-6" viewBox="0 0 36 18">
                {/* Background semicircle */}
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831"
                />
                {/* Progress semicircle */}
                <path
                  className="text-green-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${dashValue} 50`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831"
                />
              </svg>
              {/* Percentage text in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-700">
                  {formatPercentage(yesPercentage)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row - Countdown Timer */}
        <div className="flex items-center mb-4">
          {/* Countdown Timer */}
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
            isEnded 
              ? 'bg-gray-100 text-gray-600' 
              : timeRemaining < 3600 
                ? 'bg-red-100 text-red-600'
                : timeRemaining < 86400
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-green-100 text-green-600'
          }`}>
            <span className="mr-1">⏰</span>
            {isEnded ? 'Ended' : formatTimeRemaining(timeRemaining)}
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-t border-gray-100 mb-4"></div>

        {/* Last Row - Volume and YES/NO Buttons */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center">
            <span className="text-blue-500 mr-2 text-sm">💎</span>
            <span className="text-blue-500 mr-1 text-sm">📈</span>
            <span className="text-sm text-gray-600">
              {formatCurrency(totalPool)}
            </span>
          </div>

          {/* YES/NO Buttons */}
          <div className="flex gap-1.5">
            <div className="relative group">
              <button 
                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-all duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/market/${market.id}`;
                }}
              >
                YES
              </button>
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {formatPercentage(yesPercentage)} YES
              </div>
            </div>

            <div className="relative group">
              <button 
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-all duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/market/${market.id}`;
                }}
              >
                NO
              </button>
              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {formatPercentage(100 - yesPercentage)} NO
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MarketCard;
