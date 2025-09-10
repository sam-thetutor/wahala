const { createClient } = require('@supabase/supabase-js')
const { createPublicClient, http } = require('viem')
const { celo } = require('viem/chains')

// Load environment variables
require('dotenv').config()

const PREDICTION_MARKET_CORE_ADDRESS = '0x7176D16D61A122231a78749c61740ad8F86BB13a'

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

// Simplified ABI with just the functions we need
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "nextMarketId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "marketId", "type": "uint256"}],
    "name": "markets",
    "outputs": [
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
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "marketId", "type": "uint256"}],
    "name": "marketMetadata",
    "outputs": [
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string", "name": "category", "type": "string"},
      {"internalType": "string", "name": "image", "type": "string"},
      {"internalType": "string", "name": "source", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

async function syncSimpleNewContract() {
  console.log('🚀 Starting simple sync from new contract...')
  console.log('📋 Contract Address:', PREDICTION_MARKET_CORE_ADDRESS)
  
  try {
    // Get current block number
    const currentBlock = await publicClient.getBlockNumber()
    console.log(`📊 Current block: ${currentBlock}`)
    
    // Get market count from contract
    const nextMarketId = await publicClient.readContract({
      address: PREDICTION_MARKET_CORE_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'nextMarketId'
    })
    
    const marketCount = Number(nextMarketId) - 1
    console.log(`📊 Found ${marketCount} markets in contract`)
    
    if (marketCount === 0) {
      console.log('✅ No markets to sync')
      return
    }
    
    let syncedCount = 0
    let failedCount = 0
    
    // Sync each market
    for (let marketId = 1; marketId <= marketCount; marketId++) {
      try {
        console.log(`\n🔄 Syncing market ${marketId}/${marketCount}...`)
        
        // Get market data using the markets mapping
        const marketData = await publicClient.readContract({
          address: PREDICTION_MARKET_CORE_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'markets',
          args: [BigInt(marketId)]
        })
        
        // Get market metadata
        const metadata = await publicClient.readContract({
          address: PREDICTION_MARKET_CORE_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'marketMetadata',
          args: [BigInt(marketId)]
        })
        
        console.log(`   📝 Question: ${marketData.question}`)
        console.log(`   👤 Creator: ${marketData.creator}`)
        console.log(`   📅 End Time: ${new Date(Number(marketData.endTime) * 1000).toLocaleString()}`)
        console.log(`   💰 Total Pool: ${Number(marketData.totalPool) / 1e18} CELO`)
        console.log(`   ✅ Yes: ${Number(marketData.totalYes) / 1e18} CELO`)
        console.log(`   ❌ No: ${Number(marketData.totalNo) / 1e18} CELO`)
        console.log(`   📊 Status: ${marketData.status === 0 ? 'ACTIVE' : marketData.status === 1 ? 'RESOLVED' : 'CANCELLED'}`)
        console.log(`   🎯 Outcome: ${marketData.outcome ? 'YES' : 'NO'}`)
        console.log(`   📝 Description: ${metadata.description}`)
        console.log(`   🏷️  Category: ${metadata.category}`)
        
        // Prepare market data for database
        const marketRecord = {
          id: marketId.toString(),
          question: marketData.question,
          description: metadata.description,
          creator: marketData.creator,
          endtime: marketData.endTime.toString(),
          totalpool: marketData.totalPool.toString(),
          totalyes: marketData.totalYes.toString(),
          totalno: marketData.totalNo.toString(),
          status: marketData.status,
          outcome: marketData.outcome,
          createdat: new Date(Number(marketData.createdAt) * 1000).toISOString(),
          category: metadata.category || 'General',
          image: metadata.image || '',
          source: metadata.source || 'Blockchain Sync',
          type: 'prediction_market'
        }
        
        // Insert or update market in database
        const { data, error } = await supabase
          .from('markets')
          .upsert(marketRecord, { onConflict: 'id' })
        
        if (error) {
          console.error(`   ❌ Failed to sync market ${marketId}:`, error.message)
          failedCount++
        } else {
          console.log(`   ✅ Market ${marketId} synced successfully`)
          syncedCount++
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`   ❌ Error syncing market ${marketId}:`, error.message)
        failedCount++
      }
    }
    
    console.log('\n🎉 Sync completed!')
    console.log(`📊 Summary:`)
    console.log(`   ✅ Successfully synced: ${syncedCount} markets`)
    console.log(`   ❌ Failed to sync: ${failedCount} markets`)
    console.log(`   📊 Total processed: ${syncedCount + failedCount} markets`)
    
    if (syncedCount > 0) {
      console.log('\n💡 Markets are now available in the database and frontend!')
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
  }
}

// Run the sync
syncSimpleNewContract()
  .then(() => {
    console.log('✅ Sync script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Sync script failed:', error)
    process.exit(1)
  })

