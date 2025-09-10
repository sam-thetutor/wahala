'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Typography } from '@/components/ui/Typography';
import { formatVolume, formatDate, shortenAddress } from '@/lib/utils';
import { Clock, TrendingUp, Users } from 'lucide-react';

interface MarketHeaderProps {
  market: {
    id: string;
    question: string;
    image?: string;
    creator: string;
    endTime: string;
    totalYes: string;
    totalNo: string;
    description?: string;
    source?: string;
  };
  totalVolume: number;
  yesPercentage: number;
  noPercentage: number;
  participantsCount: number;
}

const MarketHeader: React.FC<MarketHeaderProps> = ({
  market,
  totalVolume,
  yesPercentage,
  noPercentage,
  participantsCount
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Market Image */}
          <div className="flex-shrink-0 self-center lg:self-start">
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden">
              <Image
                src={market.image || "https://a2ede-rqaaa-aaaal-ai6sq-cai.raw.icp0.io/uploads/food1.612.612.jpg"}
                alt={market.question}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Market Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <Typography variant="h1" className="mb-3 text-center lg:text-left">
                  {market.question}
                </Typography>
                
                {/* Market Metadata */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                  <Badge variant="success" size="sm">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {formatVolume(totalVolume)} CELO
                  </Badge>
                  
                  <Badge variant="outline" size="sm">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(market.endTime)}
                  </Badge>
                  
                  <Typography variant="caption" color="muted">
                    by {shortenAddress(market.creator)}
                  </Typography>
                </div>
                
                {/* Market Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center lg:text-left">
                    <Typography variant="caption" color="muted" className="block mb-1">
                      Yes Shares
                    </Typography>
                    <Typography variant="body" weight="semibold" color="success">
                      {formatVolume(parseFloat(market.totalYes))}
                    </Typography>
                  </div>
                  
                  <div className="text-center lg:text-left">
                    <Typography variant="caption" color="muted" className="block mb-1">
                      No Shares
                    </Typography>
                    <Typography variant="body" weight="semibold" color="error">
                      {formatVolume(parseFloat(market.totalNo))}
                    </Typography>
                  </div>
                  
                  <div className="text-center lg:text-left">
                    <Typography variant="caption" color="muted" className="block mb-1">
                      Participants
                    </Typography>
                    <Typography variant="body" weight="semibold">
                      <Users className="w-4 h-4 inline mr-1" />
                      {participantsCount}
                    </Typography>
                  </div>
                  
                  <div className="text-center lg:text-left">
                    <Typography variant="caption" color="muted" className="block mb-1">
                      Yes Odds
                    </Typography>
                    <Typography variant="body" weight="semibold" color="success">
                      {yesPercentage.toFixed(1)}%
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Market Status */}
              <div className="flex flex-col items-center lg:items-end gap-2">
                <Badge 
                  variant={yesPercentage > 70 ? "success" : yesPercentage > 30 ? "warning" : "error"}
                  size="lg"
                >
                  {yesPercentage.toFixed(1)}% YES
                </Badge>
                
                <Typography variant="caption" color="muted">
                  {noPercentage.toFixed(1)}% NO
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketHeader;
