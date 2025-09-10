'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface MarketSummaryProps {
  description?: string;
  source?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const MarketSummary: React.FC<MarketSummaryProps> = ({
  description,
  source,
  isExpanded,
  onToggle
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Market Summary</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Expand
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {description && (
            <div>
              <Typography variant="body" className="whitespace-pre-wrap">
                {description}
              </Typography>
            </div>
          )}
          
          {source && (
            <div className="pt-4 border-t border-border">
              <Typography variant="body" weight="semibold" className="mb-2">
                Source
              </Typography>
              <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {source}
              </a>
            </div>
          )}
          
          {!description && !source && (
            <div className="text-center py-8">
              <Typography variant="body" color="muted">
                No additional information available for this market.
              </Typography>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default MarketSummary;
