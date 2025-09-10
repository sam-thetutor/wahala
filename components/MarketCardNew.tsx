'use client';

import React from 'react';
import Link from 'next/link';
import { MarketWithMetadata } from '@/contracts/contracts';
import { formatEther } from 'viem';
import { Clock, Users, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Typography, Body, BodySmall, Caption } from '@/components/ui/Typography';
import { formatTimeRemaining, formatCurrency, formatPercentage } from '@/lib/utils';

interface MarketCardNewProps {
  market: MarketWithMetadata;
  className?: string;
}

const MarketCardNew: React.FC<MarketCardNewProps> = ({ market, className }) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const endTime = Number(market.endTime);
  const isEnded = endTime <= currentTime;
  const timeRemaining = endTime - currentTime;
  
  // Calculate market statistics
  const totalPool = Number(formatEther(market.totalPool));
  const totalYes = Number(formatEther(market.totalYes));
  const totalNo = Number(formatEther(market.totalNo));
  const totalShares = totalYes + totalNo;
  const yesPercentage = totalShares > 0 ? (totalYes / totalShares) * 100 : 50;
  
  // Get status badge variant
  const getStatusVariant = () => {
    if (isEnded) return 'market-ended';
    if (timeRemaining < 3600) return 'warning'; // Less than 1 hour
    if (timeRemaining < 86400) return 'pending'; // Less than 1 day
    return 'market-active';
  };
  
  // Get category badge variant
  const getCategoryVariant = (category: string): "politics" | "sports" | "technology" | "entertainment" | "finance" | "science" | "weather" | "general" => {
    const categoryMap: { [key: string]: "politics" | "sports" | "technology" | "entertainment" | "finance" | "science" | "weather" | "general" } = {
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
      <Card 
        className={`h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group ${className}`}
        hover="lift"
      >
        {/* Market Image Header */}
        <div className="relative h-32 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-t-lg overflow-hidden">
          {market.image && market.image !== '' ? (
            <img 
              src={market.image} 
              alt={market.question}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant={getStatusVariant()} size="sm">
              {isEnded ? 'Ended' : formatTimeRemaining(timeRemaining)}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-3">
          {/* Category */}
          <div className="mb-2">
            <Badge variant={getCategoryVariant(market.category)} size="sm">
              {market.category}
            </Badge>
          </div>

          {/* Question */}
          <CardTitle className="line-clamp-2 text-base leading-tight">
            {market.question}
          </CardTitle>

          {/* Description */}
          <CardDescription className="line-clamp-2 text-sm">
            {market.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* YES/NO Pool Visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-gray-600">YES</span>
                <span className="font-semibold text-gray-900">
                  {formatPercentage(yesPercentage)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-error-500 rounded-full"></div>
                <span className="text-gray-600">NO</span>
                <span className="font-semibold text-gray-900">
                  {formatPercentage(100 - yesPercentage)}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-success-500 to-success-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <div>
                <Caption>Pool</Caption>
                <BodySmall className="font-semibold">
                  {formatCurrency(totalPool)}
                </BodySmall>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <Caption>Ends</Caption>
                <BodySmall className="font-semibold">
                  {new Date(endTime * 1000).toLocaleDateString()}
                </BodySmall>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default MarketCardNew;
