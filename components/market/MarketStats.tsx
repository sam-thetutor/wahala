'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { formatVolume, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, Clock } from 'lucide-react';

interface MarketStatsProps {
  totalVolume: number;
  yesShares: number;
  noShares: number;
  participantsCount: number;
  yesPercentage: number;
  noPercentage: number;
  timeRemaining: number;
  isEnded: boolean;
}

const MarketStats: React.FC<MarketStatsProps> = ({
  totalVolume,
  yesShares,
  noShares,
  participantsCount,
  yesPercentage,
  noPercentage,
  timeRemaining,
  isEnded
}) => {
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ended';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Volume */}
      <Card>
        <CardContent className="p-4 text-center">
          <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
          <Typography variant="h3" weight="bold" className="mb-1">
            {formatVolume(totalVolume)}
          </Typography>
          <Typography variant="caption" color="muted">
            Total Volume
          </Typography>
        </CardContent>
      </Card>

      {/* Yes Shares */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <Typography variant="h3" weight="bold" color="success" className="mb-1">
            {formatVolume(yesShares)}
          </Typography>
          <Typography variant="caption" color="muted">
            Yes Shares
          </Typography>
        </CardContent>
      </Card>

      {/* No Shares */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="w-8 h-8 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingDown className="w-4 h-4 text-error" />
          </div>
          <Typography variant="h3" weight="bold" color="error" className="mb-1">
            {formatVolume(noShares)}
          </Typography>
          <Typography variant="caption" color="muted">
            No Shares
          </Typography>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="w-8 h-8 text-primary mx-auto mb-2" />
          <Typography variant="h3" weight="bold" className="mb-1">
            {participantsCount}
          </Typography>
          <Typography variant="caption" color="muted">
            Participants
          </Typography>
        </CardContent>
      </Card>

      {/* Time Remaining */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <Typography variant="h4" weight="semibold">
              {isEnded ? 'Market Ended' : 'Time Remaining'}
            </Typography>
          </div>
          <Typography variant="h2" weight="bold" color={isEnded ? "muted" : "primary"}>
            {formatTimeRemaining(timeRemaining)}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketStats;
