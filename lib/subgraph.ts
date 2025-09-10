import { formatEther, parseEther } from 'viem'

// Subgraph endpoint
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/120210/core/0.2'

// GraphQL client
export const subgraphClient = {
  async query(query: string, variables?: any) {
    try {
      const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
      })
      
      if (!response.ok) {
        throw new Error(`Subgraph query failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
      }
      
      return data
    } catch (error) {
      console.error('Subgraph query error:', error)
      throw error
    }
  }
}

// GraphQL queries
export const queries = {
  getMarkets: `
    query GetMarkets {
      markets {
        id
        question
        description
        source
        totalPool
        totalYes
        totalNo
        status
        creator
        createdAt
        endTime
        resolver
      }
    }
  `,
  
  getMarket: `
    query GetMarket($id: ID!) {
      market(id: $id) {
        id
        question
        description
        source
        totalPool
        totalYes
        totalNo
        status
        creator
        createdAt
        endTime
        resolver
        resolvedAt
        outcome
      }
    }
  `,
  
  getParticipants: `
    query GetParticipants($marketId: String!) {
      participants(where: { market: $marketId }) {
        id
        user
        totalInvestment
        totalYesShares
        totalNoShares
        firstPurchaseAt
        lastPurchaseAt
        transactionCount
      }
    }
  `,
  
  getGlobalStats: `
    query GetGlobalStats {
      globalStats(id: "global") {
        totalMarkets
        totalParticipants
        totalVolume
        totalFees
        lastUpdated
      }
    }
  `,
  
  getRecentEvents: `
    query GetRecentEvents($first: Int = 10) {
      sharesBoughts(first: $first, orderBy: blockTimestamp, orderDirection: desc) {
        id
        marketId
        buyer
        side
        amount
        totalYes
        totalNo
        blockTimestamp
        transactionHash
      }
    }
  `,
  
  getUserClaims: `
    query GetUserClaims($userAddress: String!) {
      # Get markets where user participated and market is resolved
      participants(where: { user: $userAddress }) {
        id
        market {
          id
          question
          description
          status
          outcome
          totalYes
          totalNo
          totalPool
          resolvedAt
          creator
        }
        totalYesShares
        totalNoShares
        totalInvestment
        firstPurchaseAt
        lastPurchaseAt
        transactionCount
      }
      # Get markets created by user that are resolved
      markets(where: { creator: $userAddress, status: RESOLVED }) {
        id
        question
        description
        status
        outcome
        resolvedAt
        creator
        totalPool
        totalYes
        totalNo
      }
    }
  `,
  
  getUserParticipations: `
    query GetUserParticipations($userAddress: String!) {
      participants(where: { user: $userAddress }) {
        id
        market {
          id
          question
          status
          outcome
          resolvedAt
        }
        totalYesShares
        totalNoShares
        totalInvestment
      }
    }
  `,

  getUserWinningsClaims: `
    query GetUserWinningsClaims($userAddress: String!) {
      winningsClaimeds(where: { claimant: $userAddress }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        marketId
        claimant
        amount
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  getMarketWinningsClaims: `
    query GetMarketWinningsClaims($marketId: String!) {
      winningsClaimeds(where: { marketId: $marketId }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        marketId
        claimant
        amount
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `,

  checkUserClaimedWinnings: `
    query CheckUserClaimedWinnings($userAddress: String!, $marketId: String!) {
      winningsClaimeds(where: { claimant: $userAddress, marketId: $marketId }) {
        id
        amount
        blockTimestamp
      }
    }
  `,

  // Enhanced user statistics query
  getUserComprehensiveStats: `
    query GetUserComprehensiveStats($userAddress: String!) {
      # User participations with market details
      participants(where: { user: $userAddress }) {
        id
        user
        market {
          id
          question
          status
          outcome
          totalPool
          totalYes
          totalNo
          resolvedAt
          creator
        }
        totalInvestment
        totalYesShares
        totalNoShares
        firstPurchaseAt
        lastPurchaseAt
        transactionCount
      }
      
      # Markets created by user
      markets(where: { creator: $userAddress }) {
        id
        question
        status
        outcome
        totalPool
        totalYes
        totalNo
        createdAt
        endTime
        resolvedAt
        creator
      }
      
      # Winnings claimed by user
      winningsClaimeds(where: { claimant: $userAddress }) {
        id
        marketId
        claimant
        amount
        blockTimestamp
        transactionHash
      }
      
      # Creator fees claimed by user
      creatorFeeClaimeds(where: { creator: $userAddress }) {
        id
        marketId
        creator
        amount
        blockTimestamp
        transactionHash
      }
    }
  `,

  // User activity feed with market context
  getUserActivityFeed: `
    query GetUserActivityFeed($userAddress: String!, $first: Int = 20, $skip: Int = 0) {
      # Recent shares bought by user
      sharesBoughts(
        where: { buyer: $userAddress }
        first: $first
        skip: $skip
        orderBy: blockTimestamp
        orderDirection: desc
      ) {
        id
        marketId
        buyer
        side
        amount
        totalYes
        totalNo
        blockTimestamp
        transactionHash
      }
      
      # Markets created by user
      markets(
        where: { creator: $userAddress }
        first: $first
        skip: $skip
        orderBy: createdAt
        orderDirection: desc
      ) {
        id
        question
        status
        outcome
        totalPool
        totalYes
        totalNo
        createdAt
        endTime
        resolvedAt
        creator
      }
      
      # Get all markets that user has participated in via participants
      participants(where: { user: $userAddress }) {
        market {
          id
          question
          status
          outcome
          totalPool
          totalYes
          totalNo
          createdAt
          endTime
          resolvedAt
          creator
        }
      }
      
      # Winnings claimed by user
      winningsClaimeds(
        where: { claimant: $userAddress }
        first: $first
        skip: $skip
        orderBy: blockTimestamp
        orderDirection: desc
      ) {
        id
        marketId
        claimant
        amount
        blockTimestamp
        transactionHash
      }
      
      # Creator fees claimed by user
      creatorFeeClaimeds(
        where: { creator: $userAddress }
        first: $first
        skip: $skip
        orderBy: blockTimestamp
        orderDirection: desc
      ) {
        id
        marketId
        creator
        amount
        blockTimestamp
        transactionHash
      }
    }
  `,

  // User markets with performance metrics
  getUserMarketsWithPerformance: `
    query GetUserMarketsWithPerformance($userAddress: String!) {
      markets(where: { creator: $userAddress }) {
        id
        question
        description
        status
        outcome
        totalPool
        totalYes
        totalNo
        createdAt
        endTime
        resolvedAt
        creator
      }
      
      # Get participants for all markets created by user
      participants(where: { market_: { creator: $userAddress } }) {
        id
        market {
          id
        }
        user
        totalInvestment
        totalYesShares
        totalNoShares
        transactionCount
      }
      
      # Get creator fee claims for all markets created by user
      creatorFeeClaimeds(where: { creator: $userAddress }) {
        id
        marketId
        creator
        amount
        blockTimestamp
        transactionHash
      }
    }
  `,

  // User claims and winnings
  getUserClaimsAndWinnings: `
    query GetUserClaimsAndWinnings($userAddress: String!) {
      # All winnings claimed
      winningsClaimeds(where: { claimant: $userAddress }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        marketId
        claimant
        amount
        blockTimestamp
        transactionHash
      }
      
      # All creator fees claimed
      creatorFeeClaimeds(where: { creator: $userAddress }, orderBy: blockTimestamp, orderDirection: desc) {
        id
        marketId
        creator
        amount
        blockTimestamp
        transactionHash
      }
      
      # User participations to calculate available claims
      participants(where: { user: $userAddress }) {
        id
        market {
          id
          question
          status
          outcome
          totalYes
          totalNo
          totalPool
          creator
        }
        totalYesShares
        totalNoShares
        totalInvestment
      }
    }
  `,

  // User trading performance analysis
  getUserTradingPerformance: `
    query GetUserTradingPerformance($userAddress: String!) {
      # All user participations for performance analysis
      participants(where: { user: $userAddress }) {
        id
        market {
          id
          question
          status
          outcome
          totalPool
          totalYes
          totalNo
          createdAt
          endTime
          resolvedAt
        }
        totalInvestment
        totalYesShares
        totalNoShares
        firstPurchaseAt
        lastPurchaseAt
        transactionCount
      }
      
      # Recent trading activity
      sharesBoughts(
        where: { buyer: $userAddress }
        first: 100
        orderBy: blockTimestamp
        orderDirection: desc
      ) {
        id
        marketId
        buyer
        side
        amount
        totalYes
        totalNo
        blockTimestamp
        transactionHash
      }
    }
  `
}

// Type definitions
export interface SubgraphMarket {
  id: string
  question: string
  description: string
  source: string
  totalPool: string // wei as string
  totalYes: string // wei as string
  totalNo: string // wei as string
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED'
  creator: string
  createdAt: string
  endTime: string
  resolver?: string
  resolvedAt?: string
  outcome?: boolean
}

export interface SubgraphParticipant {
  id: string
  user: string
  totalInvestment: string // wei as string
  totalYesShares: string // wei as string
  totalNoShares: string // wei as string
  firstPurchaseAt: string
  lastPurchaseAt: string
  transactionCount: string
}

export interface SubgraphGlobalStats {
  totalMarkets: string
  totalParticipants: string
  totalVolume: string
  totalFees: string
  lastUpdated: string
}

export interface SubgraphUserClaim {
  participants: Array<{
    id: string
    market: {
      id: string
      question: string
      description: string
      status: string
      outcome: boolean
      totalYes: string
      totalNo: string
      totalPool: string
      resolvedAt: string
      creator: string
    }
    totalYesShares: string
    totalNoShares: string
    totalInvestment: string
    firstPurchaseAt: string
    lastPurchaseAt: string
    transactionCount: string
  }>
  markets: Array<{
    id: string
    question: string
    description: string
    status: string
    outcome: boolean
    resolvedAt: string
    creator: string
    totalPool: string
    totalYes: string
    totalNo: string
  }>
}

export interface SubgraphWinningsClaimed {
  id: string
  marketId: string
  claimant: string
  amount: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

// Enhanced user data interfaces
export interface SubgraphUserComprehensiveStats {
  participants: Array<{
    id: string
    user: string
    market: {
      id: string
      question: string
      status: string
      outcome?: boolean
      totalPool: string
      totalYes: string
      totalNo: string
      resolvedAt?: string
      creator: string
    }
    totalInvestment: string
    totalYesShares: string
    totalNoShares: string
    firstPurchaseAt: string
    lastPurchaseAt: string
    transactionCount: string
  }>
  markets: Array<{
    id: string
    question: string
    status: string
    outcome?: boolean
    totalPool: string
    totalYes: string
    totalNo: string
    createdAt: string
    endTime: string
    resolvedAt?: string
    creator: string
  }>
  winningsClaimeds: Array<{
    id: string
    marketId: string
    claimant: string
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
  creatorFeeClaimeds: Array<{
    id: string
    marketId: string
    creator: string
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
}

export interface SubgraphUserActivityFeed {
  sharesBoughts: Array<{
    id: string
    marketId: string
    buyer: string
    side: boolean
    amount: string
    totalYes: string
    totalNo: string
    blockTimestamp: string
    transactionHash: string
  }>
  markets: Array<{
    id: string
    question: string
    status: string
    outcome?: boolean
    totalPool: string
    totalYes: string
    totalNo: string
    createdAt: string
    endTime: string
    resolvedAt?: string
    creator: string
  }>
  participants: Array<{
    market: {
      id: string
      question: string
      status: string
      outcome?: boolean
      totalPool: string
      totalYes: string
      totalNo: string
      createdAt: string
      endTime: string
      resolvedAt?: string
      creator: string
    }
  }>
  winningsClaimeds: Array<{
    id: string
    marketId: string
    claimant: string
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
  creatorFeeClaimeds: Array<{
    id: string
    marketId: string
    creator: string
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
}

export interface SubgraphUserMarketsWithPerformance {
  markets: Array<{
    id: string
    question: string
    description: string
    status: string
    outcome?: boolean
    totalPool: string
    totalYes: string
    totalNo: string
    createdAt: string
    endTime: string
    resolvedAt?: string
    creator: string
  }>
  participants: Array<{
    id: string
    market: {
      id: string
    }
    user: string
    totalInvestment: string
    totalYesShares: string
    totalNoShares: string
    transactionCount: string
  }>
  creatorFeeClaimeds: Array<{
    id: string
    marketId: string
    creator: string
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
}

export interface SubgraphUserClaimsAndWinnings {
  winningsClaimeds: Array<{
    id: string
    marketId: string
    claimant: string
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
  creatorFeeClaimeds: Array<{
    id: string
    marketId: string
    creator: string
    amount: string
    blockTimestamp: string
    transactionHash: string
  }>
  participants: Array<{
    id: string
    market: {
      id: string
      question: string
      status: string
      outcome?: boolean
      totalYes: string
      totalNo: string
      totalPool: string
      creator: string
    }
    totalYesShares: string
    totalNoShares: string
    totalInvestment: string
  }>
}

export interface SubgraphUserTradingPerformance {
  participants: Array<{
    id: string
    market: {
      id: string
      question: string
      status: string
      outcome?: boolean
      totalPool: string
      totalYes: string
      totalNo: string
      createdAt: string
      endTime: string
      resolvedAt?: string
    }
    totalInvestment: string
    totalYesShares: string
    totalNoShares: string
    firstPurchaseAt: string
    lastPurchaseAt: string
    transactionCount: string
  }>
  sharesBoughts: Array<{
    id: string
    marketId: string
    buyer: string
    side: boolean
    amount: string
    totalYes: string
    totalNo: string
    blockTimestamp: string
    transactionHash: string
  }>
}

export interface SubgraphSharesBought {
  id: string
  marketId: string
  buyer: string
  side: boolean
  amount: string // wei as string
  totalYes: string // wei as string
  totalNo: string // wei as string
  blockTimestamp: string
  transactionHash: string
}

// Utility functions for wei conversion
export const formatWeiToEther = (wei: string): string => {
  try {
    return formatEther(BigInt(wei))
  } catch (error) {
    console.error('Error formatting wei to ether:', error)
    return '0'
  }
}

export const parseEtherToWei = (ether: string): string => {
  try {
    return parseEther(ether).toString()
  } catch (error) {
    console.error('Error parsing ether to wei:', error)
    return '0'
  }
}

// Market data transformation
export const transformMarket = (market: SubgraphMarket) => {
  return {
    ...market,
    totalPool: formatWeiToEther(market.totalPool),
    totalYes: formatWeiToEther(market.totalYes),
    totalNo: formatWeiToEther(market.totalNo),
    createdAt: new Date(parseInt(market.createdAt) * 1000).toISOString(),
    endTime: new Date(parseInt(market.endTime) * 1000).toISOString(),
    resolvedAt: market.resolvedAt ? new Date(parseInt(market.resolvedAt) * 1000).toISOString() : null
  }
}

// Participant data transformation
export const transformParticipant = (participant: SubgraphParticipant) => ({
  ...participant,
  totalInvestment: formatWeiToEther(participant.totalInvestment),
  totalYesShares: formatWeiToEther(participant.totalYesShares),
  totalNoShares: formatWeiToEther(participant.totalNoShares),
  firstPurchaseAt: new Date(parseInt(participant.firstPurchaseAt) * 1000).toISOString(),
  lastPurchaseAt: new Date(parseInt(participant.lastPurchaseAt) * 1000).toISOString()
})

// Global stats transformation
export const transformGlobalStats = (stats: SubgraphGlobalStats) => ({
  ...stats,
  totalMarkets: parseInt(stats.totalMarkets),
  totalParticipants: parseInt(stats.totalParticipants),
  totalVolume: formatWeiToEther(stats.totalVolume),
  totalFees: formatWeiToEther(stats.totalFees),
  lastUpdated: new Date(parseInt(stats.lastUpdated) * 1000).toISOString()
})

// API functions
export const subgraphApi = {
  async getMarkets(): Promise<SubgraphMarket[]> {
    const { data } = await subgraphClient.query(queries.getMarkets)
    return data.markets || []
  },
  
  async getMarket(id: string): Promise<SubgraphMarket | null> {
    const { data } = await subgraphClient.query(queries.getMarket, { id })
    return data.market || null
  },
  
  async getParticipants(marketId: string): Promise<SubgraphParticipant[]> {
    const { data } = await subgraphClient.query(queries.getParticipants, { marketId })
    return data.participants || []
  },
  
  async getGlobalStats(): Promise<SubgraphGlobalStats | null> {
    const { data } = await subgraphClient.query(queries.getGlobalStats)
    return data.globalStats || null
  },
  
  async getRecentEvents(limit: number = 10): Promise<SubgraphSharesBought[]> {
    const { data } = await subgraphClient.query(queries.getRecentEvents, { first: limit })
    return data.sharesBoughts || []
  },

  async getUserWinningsClaims(userAddress: string): Promise<SubgraphWinningsClaimed[]> {
    const { data } = await subgraphClient.query(queries.getUserWinningsClaims, { userAddress })
    return data.winningsClaimeds || []
  },

  async getMarketWinningsClaims(marketId: string): Promise<SubgraphWinningsClaimed[]> {
    const { data } = await subgraphClient.query(queries.getMarketWinningsClaims, { marketId })
    return data.winningsClaimeds || []
  },

  async checkUserClaimedWinnings(userAddress: string, marketId: string): Promise<boolean> {
    const { data } = await subgraphClient.query(queries.checkUserClaimedWinnings, { userAddress, marketId })
    return data.winningsClaimeds && data.winningsClaimeds.length > 0
  },

  // Enhanced user data API functions
  async getUserComprehensiveStats(userAddress: string): Promise<SubgraphUserComprehensiveStats> {
    const { data } = await subgraphClient.query(queries.getUserComprehensiveStats, { userAddress })
    return data
  },

  async getUserActivityFeed(userAddress: string, first: number = 20, skip: number = 0): Promise<SubgraphUserActivityFeed> {
    const { data } = await subgraphClient.query(queries.getUserActivityFeed, { userAddress, first, skip })
    return data
  },

  async getUserMarketsWithPerformance(userAddress: string): Promise<SubgraphUserMarketsWithPerformance> {
    const { data } = await subgraphClient.query(queries.getUserMarketsWithPerformance, { userAddress })
    return data
  },

  async getUserClaimsAndWinnings(userAddress: string): Promise<SubgraphUserClaimsAndWinnings> {
    const { data } = await subgraphClient.query(queries.getUserClaimsAndWinnings, { userAddress })
    return data
  },

  async getUserTradingPerformance(userAddress: string): Promise<SubgraphUserTradingPerformance> {
    const { data } = await subgraphClient.query(queries.getUserTradingPerformance, { userAddress })
    return data
  }
}
