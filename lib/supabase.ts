import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (matching actual database column names)
export interface Market {
  id: string
  question: string
  endtime: string
  totalpool: string
  totalyes: string
  totalno: string
  status: number
  outcome: boolean
  createdat: string
  creator: string
  description: string
  category: string
  image: string
  source: string
  updatedat: string
}

export interface MarketEvent {
  id: string
  marketId: string
  eventType: string
  blockNumber: string
  transactionHash: string
  args: string
  createdAt: string
}

export interface MarketParticipant {
  id: string
  marketid: string
  address: string
  totalyesshares: string
  totalnoshares: string
  totalinvestment: string
  firstpurchaseat: string
  lastpurchaseat: string
  transactionhashes: string[]
}

export interface SyncStatus {
  id: string
  lastSyncBlock: string
  lastSyncTime: string
  isActive: boolean
}

