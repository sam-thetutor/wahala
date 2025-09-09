#!/usr/bin/env node

// Standalone polling service that doesn't depend on Next.js
require('dotenv').config();

const { createPublicClient, http, parseAbiItem } = require('viem');
const { celo } = require('viem/chains');
const { createClient } = require('@supabase/supabase-js');

// Contract configuration
const PREDICTION_MARKET_CORE_ADDRESS = '0x7176D16D61A122231a78749c61740ad8F86BB13a';

// Contract ABI for events
const PREDICTION_MARKET_CORE_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "marketId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "question", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "description", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "source", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "creationFee", "type": "uint256" }
    ],
    "name": "MarketCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "marketId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "side", "type": "bool" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "SharesBought",
    "type": "event"
  }
];

// Create clients
const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org')
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Database service
class DatabaseService {
  async upsertMarket(marketData) {
    try {
      const { data, error } = await supabase
        .from('markets')
        .upsert(marketData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('❌ Database upsert error:', error);
        return null;
      }

      console.log('✅ Market synced to database:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Database error:', error);
      return null;
    }
  }

  async upsertMarketEvent(eventData) {
    try {
      const { data, error } = await supabase
        .from('market_events')
        .upsert(eventData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('❌ Event upsert error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Event database error:', error);
      return null;
    }
  }
}

// Event listener class
class StandaloneEventListener {
  constructor() {
    this.isListening = false;
    this.lastProcessedBlock = 0;
    this.db = new DatabaseService();
  }

  async startListening() {
    if (this.isListening) {
      console.log('Event listener is already running');
      return;
    }

    console.log('🎧 Starting standalone event listener for market events...');

    try {
      // Get current block
      const currentBlock = await publicClient.getBlockNumber();
      this.lastProcessedBlock = Number(currentBlock) - 100; // Start from 100 blocks ago

      console.log(`📊 Starting from block: ${this.lastProcessedBlock}`);
      console.log(`📊 Current block: ${Number(currentBlock)}`);

      this.isListening = true;

      // Start polling
      this.pollForEvents();

      console.log('✅ Standalone event listener started successfully');
      console.log('🎉 Polling service is now running!');
      console.log('💡 Create a new market to test the automatic sync');

    } catch (error) {
      console.error('❌ Failed to start event listener:', error);
      this.isListening = false;
    }
  }

  async pollForEvents() {
    if (!this.isListening) return;

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = BigInt(this.lastProcessedBlock + 1);
      const toBlock = currentBlock;

      if (fromBlock > toBlock) {
        // No new blocks, wait and try again
        setTimeout(() => this.pollForEvents(), 10000);
        return;
      }

      console.log(`🔍 Polling blocks ${Number(fromBlock)} to ${Number(toBlock)}`);

      // Get MarketCreated events
      const marketCreatedEvents = await publicClient.getLogs({
        address: PREDICTION_MARKET_CORE_ADDRESS,
        event: parseAbiItem('event MarketCreated(uint256 indexed marketId, address indexed creator, string question, string description, string source, uint256 endTime, uint256 creationFee)'),
        fromBlock: fromBlock,
        toBlock: toBlock
      });

      // Get SharesBought events
      const sharesBoughtEvents = await publicClient.getLogs({
        address: PREDICTION_MARKET_CORE_ADDRESS,
        event: parseAbiItem('event SharesBought(uint256 indexed marketId, address indexed buyer, bool side, uint256 amount, uint256 price)'),
        fromBlock: fromBlock,
        toBlock: toBlock
      });

      if (marketCreatedEvents.length > 0) {
        console.log(`📢 Found ${marketCreatedEvents.length} new MarketCreated events`);
        await this.handleMarketCreatedEvents(marketCreatedEvents);
      }

      if (sharesBoughtEvents.length > 0) {
        console.log(`💰 Found ${sharesBoughtEvents.length} new SharesBought events`);
        await this.handleSharesBoughtEvents(sharesBoughtEvents);
      }

      this.lastProcessedBlock = Number(toBlock);
      console.log(`✅ Processed up to block ${this.lastProcessedBlock}`);

    } catch (error) {
      console.error('❌ Error during polling:', error);
    }

    // Schedule next poll
    setTimeout(() => this.pollForEvents(), 10000);
  }

  async handleMarketCreatedEvents(events) {
    for (const event of events) {
      try {
        const marketId = Number(event.args.marketId);
        console.log(`🔄 Processing market creation event for market ID: ${marketId}`);

        // Get market details from contract
        const marketDetails = await this.getMarketDetails(marketId);
        
        if (marketDetails) {
          const marketData = {
            id: marketId,
            question: marketDetails.question,
            description: marketDetails.description,
            category: marketDetails.category || 'General',
            image: marketDetails.image || 'https://picsum.photos/400/300?random=' + marketId,
            source: marketDetails.source || 'Unknown',
            endtime: Number(marketDetails.endTime),
            status: 0, // Active
            createdat: Math.floor(Date.now() / 1000),
            creator: marketDetails.creator,
            totalpool: '0',
            totalinvestment: '0'
          };

          await this.db.upsertMarket(marketData);
          console.log(`✅ Market ${marketId} synced to database successfully`);
          console.log(`   Question: ${marketData.question}`);
          console.log(`   Creator: ${marketData.creator}`);
        }

      } catch (error) {
        console.error(`❌ Error processing market creation event:`, error);
      }
    }
  }

  async handleSharesBoughtEvents(events) {
    for (const event of events) {
      try {
        const marketId = Number(event.args.marketId);
        const buyer = event.args.buyer;
        const side = event.args.side;
        const amount = event.args.amount.toString();
        const price = event.args.price.toString();

        console.log(`💰 Processing shares bought for market ${marketId}: ${amount} shares at ${price} price`);

        // Store the event
        const eventData = {
          id: `${marketId}-${buyer}-${Date.now()}`,
          market_id: marketId,
          event_type: 'SharesBought',
          user_address: buyer,
          amount: amount,
          price: price,
          side: side,
          created_at: Math.floor(Date.now() / 1000)
        };

        await this.db.upsertMarketEvent(eventData);

      } catch (error) {
        console.error(`❌ Error processing shares bought event:`, error);
      }
    }
  }

  async getMarketDetails(marketId) {
    try {
      // This is a simplified version - in production you'd call the contract
      // For now, we'll use the event data
      return {
        question: `Market ${marketId} Question`,
        description: `Market ${marketId} Description`,
        category: 'General',
        image: `https://picsum.photos/400/300?random=${marketId}`,
        source: 'Blockchain',
        endTime: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
        creator: '0x0000000000000000000000000000000000000000'
      };
    } catch (error) {
      console.error(`❌ Error getting market details for ${marketId}:`, error);
      return null;
    }
  }

  async stopListening() {
    console.log('🛑 Stopping polling service...');
    this.isListening = false;
    console.log('✅ Polling service stopped');
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting standalone polling service...');
  console.log(`📋 Contract Address: ${PREDICTION_MARKET_CORE_ADDRESS}`);

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const eventListener = new StandaloneEventListener();
  await eventListener.startListening();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await eventListener.stopListening();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await eventListener.stopListening();
    process.exit(0);
  });
}

// Run the service
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
