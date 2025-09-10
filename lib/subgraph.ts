import { formatEther, parseEther } from 'viem'

// Subgraph endpoint
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/120210/core/0.1'

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
  }
}
