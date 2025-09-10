'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface TradingPanelProps {
  selectedSide: 'yes' | 'no';
  onSideChange: (side: 'yes' | 'no') => void;
  buyAmount: string;
  onAmountChange: (amount: string) => void;
  onMaxAmount: () => void;
  onBuyShares: () => void;
  yesPrice: number;
  noPrice: number;
  tradingDetails: {
    shares: number;
    avgPrice: number;
    fees: number;
    potentialReturn: number;
    returnPercentage: number;
  };
  balance: string;
  isBuying: boolean;
}

const TradingPanel: React.FC<TradingPanelProps> = ({
  selectedSide,
  onSideChange,
  buyAmount,
  onAmountChange,
  onMaxAmount,
  onBuyShares,
  yesPrice,
  noPrice,
  tradingDetails,
  balance,
  isBuying
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Trading Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Side Selection */}
        <div className="space-y-3">
          <Typography variant="body" weight="semibold">
            Choose Your Side
          </Typography>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={selectedSide === 'yes' ? 'primary' : 'outline'}
              size="lg"
              onClick={() => onSideChange('yes')}
              className="flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              YES
              <Badge variant="success" size="sm">
                {formatPercentage(yesPrice * 100)}
              </Badge>
            </Button>
            
            <Button
              variant={selectedSide === 'no' ? 'primary' : 'outline'}
              size="lg"
              onClick={() => onSideChange('no')}
              className="flex items-center justify-center gap-2"
            >
              <TrendingDown className="w-4 h-4" />
              NO
              <Badge variant="error" size="sm">
                {formatPercentage(noPrice * 100)}
              </Badge>
            </Button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Typography variant="body" weight="semibold">
              Amount (CELO)
            </Typography>
            <Typography variant="caption" color="muted">
              Balance: {formatCurrency(parseFloat(balance))} CELO
            </Typography>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="number"
              value={buyAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.00"
              className="flex-1"
              min="0"
              step="0.01"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onMaxAmount}
            >
              Max
            </Button>
          </div>
        </div>

        {/* Trading Details */}
        {parseFloat(buyAmount) > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <Typography variant="body" weight="semibold">
              Trade Summary
            </Typography>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Typography variant="caption" color="muted">
                  Shares to Receive
                </Typography>
                <Typography variant="body" weight="semibold">
                  {tradingDetails.shares.toFixed(2)}
                </Typography>
              </div>
              
              <div>
                <Typography variant="caption" color="muted">
                  Average Price
                </Typography>
                <Typography variant="body" weight="semibold">
                  {formatCurrency(tradingDetails.avgPrice)}
                </Typography>
              </div>
              
              <div>
                <Typography variant="caption" color="muted">
                  Trading Fees
                </Typography>
                <Typography variant="body" weight="semibold">
                  {formatCurrency(tradingDetails.fees)}
                </Typography>
              </div>
              
              <div>
                <Typography variant="caption" color="muted">
                  Potential Return
                </Typography>
                <Typography 
                  variant="body" 
                  weight="semibold"
                  color={tradingDetails.returnPercentage > 0 ? "success" : "error"}
                >
                  {formatCurrency(tradingDetails.potentialReturn)} 
                  ({formatPercentage(tradingDetails.returnPercentage)})
                </Typography>
              </div>
            </div>
          </div>
        )}

        {/* Buy Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={onBuyShares}
          disabled={isBuying || parseFloat(buyAmount) <= 0}
          loading={isBuying}
          fullWidth
          className="mt-4"
        >
          {isBuying ? 'Processing...' : `Buy ${selectedSide.toUpperCase()} Shares`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TradingPanel;
