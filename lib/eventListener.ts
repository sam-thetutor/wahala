import { createPublicClient, http, parseAbiItem } from 'viem'
import { celo } from 'viem/chains'
import { DatabaseService } from './database'
import { PREDICTION_MARKET_CORE_ABI } from '@/contracts/contracts'
import { getCoreContractAddress } from '@/lib/contract-addresses'

// Create a public client for Celo
const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org')
})

// Event listener for market creation
export class EventListener {
  public isListening = false
  private unwatch: (() => void) | null = null
  public lastProcessedBlock = 0

  async startListening() {
    if (this.isListening) {
      console.log('Event listener is already running')
      return
    }

    console.log('🎧 Starting event listener for market events...')

    try {
      // Listen for MarketCreated events
      const marketCreatedUnwatch = publicClient.watchContractEvent({
        address: getCoreContractAddress(),
        abi: PREDICTION_MARKET_CORE_ABI,
        eventName: 'MarketCreated',
        onLogs: async (logs) => {
          console.log('📢 Market creation event detected:', logs)
          await this.handleMarketCreatedEvent(logs)
        },
        onError: (error) => {
          console.error('❌ MarketCreated event listener error:', error)
        }
      })

      // Listen for SharesBought events
      const sharesBoughtUnwatch = publicClient.watchContractEvent({
        address: getCoreContractAddress(),
        abi: PREDICTION_MARKET_CORE_ABI,
        eventName: 'SharesBought',
        onLogs: async (logs) => {
          console.log('💰 Shares bought event detected:', logs)
          await this.handleSharesBoughtEvent(logs)
        },
        onError: (error) => {
          console.error('❌ SharesBought event listener error:', error)
        }
      })

      // Store both unwatch functions
      this.unwatch = () => {
        marketCreatedUnwatch()
        sharesBoughtUnwatch()
      }

      this.isListening = true
      console.log('✅ Event listener started successfully for MarketCreated and SharesBought events')

    } catch (error) {
      console.error('❌ Failed to start event listener:', error)
      throw error
    }
  }

  async stopListening() {
    if (this.unwatch) {
      this.unwatch()
      this.unwatch = null
    }
    this.isListening = false
    console.log('🛑 Event listener stopped')
  }

  async checkForNewEvents() {
    try {
      const currentBlock = await publicClient.getBlockNumber()
      
      if (this.lastProcessedBlock >= currentBlock) {
        return // No new blocks
      }

      console.log(`🔍 Checking blocks ${Number(this.lastProcessedBlock) + 1} to ${currentBlock}`)

      // Get MarketCreated events
      const marketCreatedEvents = await publicClient.getLogs({
        address: getCoreContractAddress(),
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
              "indexed": false,
              "internalType": "string",
              "name": "question",
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
              "internalType": "address",
              "name": "creator",
              "type": "address"
            }
          ],
          "name": "MarketCreated",
          "type": "event"
        },
        fromBlock: BigInt(this.lastProcessedBlock) + 1n,
        toBlock: currentBlock
      })

      // Get SharesBought events
      const sharesBoughtEvents = await publicClient.getLogs({
        address: getCoreContractAddress(),
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
              "indexed": false,
              "internalType": "address",
              "name": "buyer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "bool",
              "name": "side",
              "type": "bool"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            }
          ],
          "name": "SharesBought",
          "type": "event"
        },
        fromBlock: BigInt(this.lastProcessedBlock) + 1n,
        toBlock: currentBlock
      })

      // Process MarketCreated events
      if (marketCreatedEvents.length > 0) {
        console.log(`📢 Found ${marketCreatedEvents.length} new MarketCreated events`)
        await this.handleMarketCreatedEvent(marketCreatedEvents)
      }

      // Process SharesBought events
      if (sharesBoughtEvents.length > 0) {
        console.log(`💰 Found ${sharesBoughtEvents.length} new SharesBought events`)
        await this.handleSharesBoughtEvent(sharesBoughtEvents)
      }

      // Update last processed block
      this.lastProcessedBlock = Number(currentBlock)
      console.log(`✅ Processed up to block ${this.lastProcessedBlock}`)

    } catch (error) {
      console.error('❌ Error checking for events:', error)
      throw error
    }
  }

  private async handleMarketCreatedEvent(logs: any[]) {
    console.log(`🔄 Processing ${logs.length} market creation events...`)

    for (const log of logs) {
      try {
        const { marketId, question, endTime, creator } = log.args

        console.log(`📝 New market created: ID ${marketId}, Question: ${question}`)

        // Fetch the complete market data from the contract
        const marketData = await this.fetchMarketFromContract(Number(marketId))
        
        if (marketData) {
          // Save to database
          await DatabaseService.upsertMarket(marketData)
          console.log(`✅ Market ${marketId} saved to database`)

          // Record the event
          await DatabaseService.addMarketEvent({
            marketId: marketId.toString(),
            eventType: 'MarketCreated',
            blockNumber: log.blockNumber?.toString() || '0',
            transactionHash: log.transactionHash || '',
            args: JSON.stringify(log.args)
          })

          console.log(`📊 Event recorded for market ${marketId}`)
        }

      } catch (error) {
        console.error('❌ Error processing market creation event:', error)
      }
    }
  }

  private async handleSharesBoughtEvent(logs: any[]) {
    console.log(`🔄 Processing ${logs.length} shares bought events...`)

    for (const log of logs) {
      try {
        const { marketId, buyer, side, amount } = log.args

        console.log(`💰 Shares bought: Market ${marketId}, Buyer: ${buyer}, Side: ${side}, Amount: ${amount}`)

        // Update the market data in the database
        const marketData = await this.fetchMarketFromContract(Number(marketId))
        
        if (marketData) {
          // Update the market in database with new totals
          await DatabaseService.upsertMarket(marketData)
          console.log(`✅ Market ${marketId} updated in database`)

          // Record the event
          await DatabaseService.addMarketEvent({
            marketId: marketId.toString(),
            eventType: 'SharesBought',
            blockNumber: log.blockNumber?.toString() || '0',
            transactionHash: log.transactionHash || '',
            args: JSON.stringify(log.args)
          })

          console.log(`📊 SharesBought event recorded for market ${marketId}`)
        }

      } catch (error) {
        console.error('❌ Error processing shares bought event:', error)
      }
    }
  }

  private async fetchMarketFromContract(marketId: number) {
    try {
      // Fetch market data
      const market = await publicClient.readContract({
        address: getCoreContractAddress(),
        abi: PREDICTION_MARKET_CORE_ABI,
        functionName: 'getMarket',
        args: [BigInt(marketId)]
      })

      // Fetch metadata
      const metadata = await publicClient.readContract({
        address: getCoreContractAddress(),
        abi: PREDICTION_MARKET_CORE_ABI,
        functionName: 'getMarketMetadata',
        args: [BigInt(marketId)]
      })

      if (market && metadata) {
        return {
          id: (market as any).id.toString(),
          question: (market as any).question,
          endtime: (market as any).endTime.toString(),
          totalpool: (market as any).totalPool.toString(),
          totalyes: (market as any).totalYes.toString(),
          totalno: (market as any).totalNo.toString(),
          status: (market as any).status,
          outcome: (market as any).outcome,
          createdat: (market as any).createdAt.toString(),
          creator: (market as any).creator,
          description: (metadata as any).description,
          category: (metadata as any).category,
          image: (metadata as any).image,
          source: (metadata as any).source
        };
      }

      return null

    } catch (error) {
      console.error('❌ Error fetching market from contract:', error)
      return null
    }
  }

  // Method to manually sync all markets (useful for initial setup)
  async syncAllMarkets() {
    console.log('🔄 Starting full market sync...')
    
    try {
      // Get market count
      const marketCount = await publicClient.readContract({
        address: getCoreContractAddress(),
        abi: [
          {
            "inputs": [],
            "name": "getMarketCount",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'getMarketCount',
        args: []
      })

      if (!marketCount || Number(marketCount) === 0) {
        console.log('No markets found in contract')
        return
      }

      const count = Number(marketCount)
      console.log(`📊 Found ${count} markets to sync`)

      // Fetch all markets in batches
      const BATCH_SIZE = 10
      const allMarkets = []

      for (let i = 0; i < count; i += BATCH_SIZE) {
        console.log(`📦 Syncing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(count / BATCH_SIZE)}`)
        
        const batchPromises = []
        
        for (let j = i; j < Math.min(i + BATCH_SIZE, count); j++) {
          const marketId = j + 1
          batchPromises.push(this.fetchMarketFromContract(marketId))
        }

        const batchResults = await Promise.all(batchPromises)
        const validMarkets = batchResults.filter(market => market !== null)
        allMarkets.push(...validMarkets)

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Upsert all markets to database
      if (allMarkets.length > 0) {
        await DatabaseService.upsertMarkets(allMarkets)
        console.log(`✅ Successfully synced ${allMarkets.length} markets to database`)
      }

    } catch (error) {
      console.error('❌ Error during full market sync:', error)
      throw error
    }
  }
}

// Export singleton instance
export const eventListener = new EventListener()
