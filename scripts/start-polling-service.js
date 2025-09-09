#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { celo } = require('viem/chains')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const PREDICTION_MARKET_CORE_ADDRESS = '0x7176D16D61A122231a78749c61740ad8F86BB13a'

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
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
  }
]

class PollingService {
  constructor() {
    this.isRunning = false
    this.lastProcessedBlock = 0
    this.pollingInterval = null
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Polling service is already running')
      return
    }

    console.log('🚀 Starting polling service...')
    console.log('📋 Contract Address:', PREDICTION_MARKET_CORE_ADDRESS)
    
    this.isRunning = true
    
    // Get current block number
    const currentBlock = await publicClient.getBlockNumber()
    this.lastProcessedBlock = Number(currentBlock) - 100 // Start from 100 blocks ago
    
    console.log(`📊 Starting from block: ${this.lastProcessedBlock}`)
    console.log(`📊 Current block: ${Number(currentBlock)}`)
    
    // Start polling every 10 seconds
    this.pollingInterval = setInterval(() => {
      this.pollForNewMarkets()
    }, 10000)
    
    // Initial poll
    this.pollForNewMarkets()
    
    console.log('✅ Polling service started successfully')
  }

  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Polling service is not running')
      return
    }

    console.log('🛑 Stopping polling service...')
    
    this.isRunning = false
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    console.log('✅ Polling service stopped')
  }

  async pollForNewMarkets() {
    try {
      const currentBlock = await publicClient.getBlockNumber()
      const currentBlockNumber = Number(currentBlock)
      
      if (this.lastProcessedBlock >= currentBlockNumber) {
        return // No new blocks
      }

      console.log(`🔍 Polling blocks ${this.lastProcessedBlock + 1} to ${currentBlockNumber}`)

      // Get MarketCreated events
      const marketCreatedEvents = await publicClient.getLogs({
        address: PREDICTION_MARKET_CORE_ADDRESS,
        event: {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "uint256",
              "name": "marketId",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "creator",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "question",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "source",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "endTime",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "creationFee",
              "type": "uint256"
            }
          ],
          "name": "MarketCreated",
          "type": "event"
        },
        fromBlock: BigInt(this.lastProcessedBlock) + 1n,
        toBlock: currentBlock
      })

      if (marketCreatedEvents.length > 0) {
        console.log(`📢 Found ${marketCreatedEvents.length} new MarketCreated events`)
        
        for (const event of marketCreatedEvents) {
          await this.processMarketCreatedEvent(event)
        }
      }

      // Update last processed block
      this.lastProcessedBlock = currentBlockNumber
      console.log(`✅ Processed up to block ${this.lastProcessedBlock}`)

    } catch (error) {
      console.error('❌ Error polling for new markets:', error)
    }
  }

  async processMarketCreatedEvent(event) {
    try {
      const marketId = Number(event.args.marketId)
      console.log(`🔄 Processing market creation event for market ID: ${marketId}`)

      // Check if market already exists in database
      const { data: existingMarket } = await supabase
        .from('markets')
        .select('id')
        .eq('id', marketId)
        .single()

      if (existingMarket) {
        console.log(`⚠️ Market ${marketId} already exists in database, skipping`)
        return
      }

      // Fetch complete market data from contract
      const marketData = await publicClient.readContract({
        address: PREDICTION_MARKET_CORE_ADDRESS,
        abi: PREDICTION_MARKET_CORE_ABI,
        functionName: 'getMarket',
        args: [BigInt(marketId)]
      })

      // Fetch market metadata
      const metadata = await publicClient.readContract({
        address: PREDICTION_MARKET_CORE_ADDRESS,
        abi: PREDICTION_MARKET_CORE_ABI,
        functionName: 'getMarketMetadata',
        args: [BigInt(marketId)]
      })

      // Prepare market record for database
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
        console.error(`❌ Error saving market ${marketId} to database:`, error.message)
      } else {
        console.log(`✅ Market ${marketId} synced to database successfully`)
        console.log(`   Question: ${marketData.question}`)
        console.log(`   Creator: ${marketData.creator}`)
      }

    } catch (error) {
      console.error(`❌ Error processing market creation event:`, error)
    }
  }
}

// Create and start the polling service
const pollingService = new PollingService()

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...')
  await pollingService.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
  await pollingService.stop()
  process.exit(0)
})

// Start the service
pollingService.start()
  .then(() => {
    console.log('🎉 Polling service is now running!')
    console.log('💡 Create a new market to test the automatic sync')
  })
  .catch((error) => {
    console.error('❌ Failed to start polling service:', error)
    process.exit(1)
  })
