'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';
import { formatVolume, formatDate, shortenAddress } from '@/lib/utils';
import { Users, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface Participant {
  id: string;
  user: string;
  totalYesShares: string;
  totalNoShares: string;
  totalInvestment?: string;
  lastTradeTime?: string;
}

interface ParticipantListProps {
  participants: Participant[];
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  isLoading,
  onRefresh,
  isRefreshing
}) => {
  const getSideBadge = (yesShares: string, noShares: string) => {
    const yes = parseFloat(yesShares);
    const no = parseFloat(noShares);
    
    if (yes > no) {
      return <Badge variant="success" size="sm">YES</Badge>;
    } else if (no > yes) {
      return <Badge variant="error" size="sm">NO</Badge>;
    } else {
      return <Badge variant="secondary" size="sm">BOTH</Badge>;
    }
  };

  const getTotalShares = (yesShares: string, noShares: string) => {
    return parseFloat(yesShares) + parseFloat(noShares);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Recent Participants
          </CardTitle>
          <Typography variant="caption" color="muted">
            {participants.length} participants
          </Typography>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <Typography variant="body" color="muted">
              Loading participants...
            </Typography>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted mx-auto mb-4" />
            <Typography variant="body" color="muted" className="mb-2">
              No participants yet
            </Typography>
            <Typography variant="caption" color="muted">
              Be the first to participate in this market!
            </Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.slice(0, 10).map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Typography variant="caption" weight="semibold" color="primary">
                      {participant.user.slice(0, 2).toUpperCase()}
                    </Typography>
                  </div>
                  
                  <div>
                    <Typography variant="body" weight="semibold">
                      {shortenAddress(participant.user)}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {participant.lastTradeTime ? formatDate(participant.lastTradeTime) : 'Unknown time'}
                    </Typography>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Typography variant="body" weight="semibold">
                      {formatVolume(getTotalShares(participant.totalYesShares, participant.totalNoShares))} shares
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {participant.totalInvestment ? formatVolume(parseFloat(participant.totalInvestment)) : '0'} CELO
                    </Typography>
                  </div>
                  
                  {getSideBadge(participant.totalYesShares, participant.totalNoShares)}
                </div>
              </div>
            ))}
            
            {participants.length > 10 && (
              <div className="text-center pt-4">
                <Typography variant="caption" color="muted">
                  Showing 10 of {participants.length} participants
                </Typography>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParticipantList;
