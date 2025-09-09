const { createClient } = require('@supabase/supabase-js')
const { createPublicClient, http } = require('viem')
const { celo } = require('viem/chains')

// Load environment variables
require('dotenv').config()

const PREDICTION_MARKET_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A'

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Viem setup
const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org')
})

// Contract ABI (simplified for the functions we need)
const PREDICTION_MARKET_ABI = [
  {
    "inputs": [],
    "name": "getMarketCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "marketId", "type": "uint256"}],
    "name": "getMarket",
    "outputs": [{
      "components": [
        {"internalType": "uint256", "name": "id", "type": "uint256"},
        {"internalType": "string", "name": "question", "type": "string"},
        {"internalType": "uint256", "name": "endTime", "type": "uint256"},
        {"internalType": "uint256", "name": "totalPool", "type": "uint256"},
        {"internalType": "uint256", "name": "totalYes", "type": "uint256"},
        {"internalType": "uint256", "name": "totalNo", "type": "uint256"},
        {"internalType": "uint8", "name": "status", "type": "uint8"},
        {"internalType": "bool", "name": "outcome", "type": "bool"},
        {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
        {"internalType": "address", "name": "creator", "type": "address"}
      ],
      "internalType": "struct PredictionMarketCore.Market",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "marketId", "type": "uint256"}],
    "name": "getMarketMetadata",
    "outputs": [{
      "components": [
        {"internalType": "string", "name": "description", "type": "string"},
        {"internalType": "string", "name": "category", "type": "string"},
        {"internalType": "string", "name": "image", "type": "string"},
        {"internalType": "string", "name": "source", "type": "string"}
      ],
      "internalType": "struct PredictionMarketCore.MarketMetadata",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
]

async function fetchMarketsFromContract() {
  try {
    console.log('🔍 Fetching market count from contract...')
    const marketCount = await publicClient.readContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'getMarketCount',
      args: []
    })

    console.log(`📊 Found ${marketCount} markets in contract`)

    if (!marketCount || Number(marketCount) === 0) {
      console.log('No markets found in contract')
      return []
    }

    const markets = []
    const count = Number(marketCount)

    // Fetch all markets in batches
    const BATCH_SIZE = 10
    for (let i = 0; i < count; i += BATCH_SIZE) {
      console.log(`📦 Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(count / BATCH_SIZE)}`)
      
      const batchPromises = []
      
      for (let j = i; j < Math.min(i + BATCH_SIZE, count); j++) {
        const marketId = j + 1 // Markets are 1-indexed
        
        batchPromises.push(
          Promise.all([
            publicClient.readContract({
              address: PREDICTION_MARKET_ADDRESS,
              abi: PREDICTION_MARKET_ABI,
              functionName: 'getMarket',
              args: [BigInt(marketId)]
            }),
            publicClient.readContract({
              address: PREDICTION_MARKET_ADDRESS,
              abi: PREDICTION_MARKET_ABI,
              functionName: 'getMarketMetadata',
              args: [BigInt(marketId)]
            })
          ])
        )
      }

      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(([market, metadata], index) => {
        if (market && metadata) {
                  markets.push({
          id: market.id.toString(),
          question: market.question,
          endtime: market.endTime.toString(),
          totalpool: market.totalPool.toString(),
          totalyes: market.totalYes.toString(),
          totalno: market.totalNo.toString(),
          status: market.status,
          outcome: market.outcome,
          createdat: market.createdAt.toString(),
          creator: market.creator,
          description: metadata.description,
          category: metadata.category,
          image: metadata.image,
          source: metadata.source
        })
        }
      })

      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`✅ Successfully fetched ${markets.length} markets from contract`)
    return markets

  } catch (error) {
    console.error('❌ Error fetching markets from contract:', error)
    throw error
  }
}

async function syncToDatabase() {
  try {
    console.log('🚀 Starting database sync...')

    // Fetch markets from contract
    const markets = await fetchMarketsFromContract()

    if (markets.length === 0) {
      console.log('No markets to sync')
      return
    }

    // Clear existing markets (optional - you might want to keep them)
    console.log('🗑️ Clearing existing markets...')
    const { error: deleteError } = await supabase
      .from('markets')
      .delete()
      .neq('id', '0') // Delete all markets

    if (deleteError) {
      console.error('Error clearing markets:', deleteError)
    }

    // Insert markets into database
    console.log('💾 Inserting markets into database...')
    const { data, error } = await supabase
      .from('markets')
      .insert(markets)

    if (error) {
      console.error('❌ Error inserting markets:', error)
      throw error
    }

    console.log(`✅ Successfully synced ${markets.length} markets to database`)

    // Update sync status
    const { error: syncError } = await supabase
      .from('sync_status')
      .upsert({
        lastSyncBlock: 'latest',
        lastSyncTime: new Date().toISOString(),
        isActive: true
      })

    if (syncError) {
      console.error('Error updating sync status:', syncError)
    }

    console.log('🎉 Database sync completed successfully!')

  } catch (error) {
    console.error('❌ Database sync failed:', error)
    process.exit(1)
  }
}

// Run the sync
syncToDatabase()
