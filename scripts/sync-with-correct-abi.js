#!/usr/bin/env node

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

// Correct ABI for the new contract
const PREDICTION_MARKET_CORE_ABI = [
  {
    "inputs": [],
    "name": "getMarketCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      }
    ],
    "name": "getMarket",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "question",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "endTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalPool",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalYes",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalNo",
            "type": "uint256"
          },
          {
            "internalType": "enum PredictionMarketCore.MarketStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "outcome",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          }
        ],
        "internalType": "struct PredictionMarketCore.Market",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "marketId",
        "type": "uint256"
      }
    ],
    "name": "getMarketMetadata",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "category",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "image",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "source",
            "type": "string"
          }
        ],
        "internalType": "struct PredictionMarketCore.MarketMetadata",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMarketCreationFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

async function syncContractToDatabase() {
  console.log('🚀 Starting sync from new contract to database...')
  console.log('📋 Contract Address:', PREDICTION_MARKET_CORE_ADDRESS)
  
  try {
    // Get current block number
    const currentBlock = await publicClient.getBlockNumber()
    console.log(`📊 Current block: ${currentBlock}`)
    
    // Get market count
    const nextMarketId = await publicClient.readContract({
      address: PREDICTION_MARKET_CORE_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketCount'
    })
    
    const marketCount = Number(nextMarketId) - 1
    console.log(`📊 Found ${marketCount} markets in contract`)
    
    if (marketCount === 0) {
      console.log('✅ No markets to sync')
      return
    }
    
    // Get creation fee
    const creationFee = await publicClient.readContract({
      address: PREDICTION_MARKET_CORE_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketCreationFee'
    })
    
    console.log(`💰 Market creation fee: ${Number(creationFee) / 1e18} CELO`)
    
    let syncedCount = 0
    let failedCount = 0
    
    // Sync each market
    for (let marketId = 1; marketId <= marketCount; marketId++) {
      try {
        console.log(`\n🔄 Syncing market ${marketId}/${marketCount}...`)
        
        // Get market data
        const marketData = await publicClient.readContract({
          address: PREDICTION_MARKET_CORE_ADDRESS,
          abi: PREDICTION_MARKET_CORE_ABI,
          functionName: 'getMarket',
          args: [BigInt(marketId)]
        })
        
        // Get market metadata
        const metadata = await publicClient.readContract({
          address: PREDICTION_MARKET_CORE_ADDRESS,
          abi: PREDICTION_MARKET_CORE_ABI,
          functionName: 'getMarketMetadata',
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
          id: marketId,
          question: marketData.question,
          description: metadata.description,
          category: metadata.category,
          image: metadata.image || 'https://picsum.photos/400/300?random=' + marketId,
          source: metadata.source || marketData.creator,
          endtime: marketData.endTime.toString(),
          totalpool: marketData.totalPool.toString(),
          totalyes: marketData.totalYes.toString(),
          totalno: marketData.totalNo.toString(),
          status: marketData.status,
          outcome: marketData.outcome,
          createdat: marketData.createdAt.toString(),
          creator: marketData.creator
        }
        
        // Insert into database
        const { error } = await supabase
          .from('markets')
          .upsert(marketRecord)
        
        if (error) {
          console.error(`   ❌ Error syncing market ${marketId}:`, error.message)
          failedCount++
        } else {
          console.log(`   ✅ Market ${marketId} synced successfully`)
          syncedCount++
        }
        
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
syncContractToDatabase()
  .then(() => {
    console.log('✅ Sync script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Sync script failed:', error)
    process.exit(1)
  })
