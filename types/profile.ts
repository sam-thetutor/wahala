// Enhanced profile types for user activity and statistics

export interface UserActivity {
  id: string;
  type: 'trading' | 'market_created' | 'market_resolved' | 'shares_sold';
  marketId: string;
  marketQuestion: string;
  marketStatus: number;
  marketOutcome?: boolean;
  totalInvestment?: string;
  totalYesShares?: string;
  totalNoShares?: string;
  primarySide?: 'yes' | 'no' | 'neutral';
  firstPurchaseAt?: Date;
  lastPurchaseAt?: Date;
  createdAt?: Date;
  transactionHashes?: string[];
  market: {
    id: string;
    question: string;
    status: number;
    outcome?: boolean;
    totalpool: string;
    totalyes: string;
    totalno: string;
    endtime: string;
    creator: string;
    createdat?: string;
  };
}

export interface UserStats {
  // Basic stats
  totalMarketsCreated: number;
  totalTrades: number;
  totalVolume: string;
  totalWinnings: string;
  
  // Trading stats
  totalYesShares: string;
  totalNoShares: string;
  winRate: number;
  averageTradeSize: string;
  
  // Market creation stats
  marketCreationSuccessRate: number;
  resolvedCreatedMarkets: number;
  
  // Activity stats
  recentTrades: number;
  recentMarketsCreated: number;
  tradingDays: number;
  tradingFrequency: number;
  
  // Performance metrics
  totalParticipationValue: string;
  averageMarketParticipation: string;
  
  // Risk metrics
  riskTolerance: 'Conservative' | 'Aggressive' | 'Balanced';
  
  // Timestamps
  lastTradeAt: number | null;
  firstTradeAt: number | null;
  lastMarketCreatedAt: number | null;
}

export interface UserEvent {
  id: string;
  eventType: string;
  marketId: string;
  blockNumber: string;
  transactionHash: string;
  args: Record<string, any>;
  createdAt: Date;
  market: {
    id: string;
    question: string;
    status: number;
    outcome?: boolean;
    totalpool: string;
    totalyes: string;
    totalno: string;
    endtime: string;
    creator: string;
  };
}

export interface ActivityFilters {
  type?: 'trading' | 'market_created' | 'market_resolved' | 'shares_sold';
  dateRange?: {
    start: Date;
    end: Date;
  };
  marketId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface EventFilters {
  eventType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  marketId?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserActivityResponse {
  activities: UserActivity[];
  stats: UserStats;
  pagination: PaginationInfo;
}

export interface UserEventsResponse {
  events: UserEvent[];
  pagination: PaginationInfo;
}

export interface UserStatsResponse {
  stats: UserStats;
}

// Activity type icons and colors
export const ACTIVITY_CONFIG = {
  trading: {
    icon: '💰',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Trading Activity'
  },
  market_created: {
    icon: '📊',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Market Created'
  },
  market_resolved: {
    icon: '✅',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Market Resolved'
  },
  shares_sold: {
    icon: '💸',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Shares Sold'
  }
} as const;

// Market status configuration
export const MARKET_STATUS_CONFIG = {
  0: {
    label: 'Active',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  1: {
    label: 'Resolved',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  2: {
    label: 'Cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
} as const;
