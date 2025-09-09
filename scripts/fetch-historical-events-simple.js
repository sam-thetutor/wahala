require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { createPublicClient, http } = require('viem');
const { celo } = require('viem/chains');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PREDICTION_MARKET_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const publicClient = createPublicClient({
  chain: celo,
  transport: http()
});

// Contract ABI for events
const MARKET_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "name": "marketId", "type": "uint256" },
      { "indexed": false, "name": "buyer", "type": "address" },
      { "indexed": false, "name": "side", "type": "bool" },
      { "indexed": false, "name": "amount", "type": "uint256" }
    ],
    "name": "SharesBought",
    "type": "event"
  }
];

// Function to manually parse event data
function parseSharesBoughtEvent(event) {
  try {
    // The event data is in the 'data' field as hex
    // Format: 0x + marketId (32 bytes) + side (32 bytes) + amount (32 bytes)
    // Topics: [event signature, marketId, buyer]
    
    const data = event.data;
    const topics = event.topics;
    
    // Extract marketId from topics[1] (indexed parameter)
    const marketId = BigInt(topics[1]);
    
    // Extract buyer from topics[2] (indexed parameter)
    const buyer = '0x' + topics[2].slice(26); // Remove padding and add 0x
    
    // Extract side and amount from data
    // Data format: 0x + side (32 bytes) + amount (32 bytes)
    const sideHex = data.slice(2, 66); // First 32 bytes after 0x
    const amountHex = data.slice(66, 130); // Second 32 bytes
    
    const side = BigInt('0x' + sideHex) !== 0n;
    const amount = BigInt('0x' + amountHex);
    
    return {
      marketId: marketId.toString(),
      buyer: buyer.toLowerCase(),
      side: side,
      amount: amount.toString()
    };
  } catch (error) {
    console.error('Error parsing event:', error);
    return null;
  }
}

async function fetchHistoricalEvents() {
  console.log('🚀 Starting historical event fetch...');

  try {
    // Get current block number
    const currentBlock = await publicClient.getBlockNumber();
    console.log(`📊 Current block: ${currentBlock}`);

    // Get contract creation block
    const contractCreationBlock = 44953084n;
    console.log(`📊 Contract creation block: ${contractCreationBlock}`);

    // Process in batches to avoid timeouts
    const batchSize = 10000n; // Process 10k blocks at a time
    let fromBlock = contractCreationBlock;
    let totalEvents = 0;
    const allEvents = [];

    while (fromBlock < currentBlock) {
      const toBlock = fromBlock + batchSize > currentBlock ? currentBlock : fromBlock + batchSize;
      
      console.log(`🔍 Fetching events from block ${fromBlock} to ${toBlock}...`);
      
      try {
        const events = await publicClient.getLogs({
          address: PREDICTION_MARKET_ADDRESS,
          event: MARKET_ABI[0],
          fromBlock: fromBlock,
          toBlock: toBlock
        });

        console.log(`📊 Found ${events.length} events in this batch`);
        allEvents.push(...events);
        totalEvents += events.length;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error fetching events for blocks ${fromBlock}-${toBlock}:`, error.message);
        fromBlock = toBlock + 1n;
      }

      fromBlock = toBlock + 1n;
    }

    console.log(`🎉 Total events fetched: ${totalEvents}`);

    // Process events and build participant data
    console.log('🔄 Processing events and building participant data...');
    const participantMap = new Map();

    for (const event of allEvents) {
      try {
        const parsed = parseSharesBoughtEvent(event);
        
        if (!parsed) {
          console.log('⚠️ Skipping unparseable event');
          continue;
        }

        const { marketId, buyer, side, amount } = parsed;
        const marketIdStr = marketId;
        const buyerStr = buyer;

        console.log(`💰 Processing: Market ${marketIdStr}, Buyer: ${buyerStr}, Side: ${side}, Amount: ${amount}`);

        if (!participantMap.has(marketIdStr)) {
          participantMap.set(marketIdStr, new Map());
        }

        const marketParticipants = participantMap.get(marketIdStr);
        
        if (!marketParticipants.has(buyerStr)) {
          marketParticipants.set(buyerStr, {
            address: buyerStr,
            totalyesshares: '0',
            totalnoshares: '0',
            totalinvestment: '0',
            transactionhashes: []
          });
        }

        const participant = marketParticipants.get(buyerStr);
        
        if (side) {
          // Bought YES shares
          participant.totalyesshares = (BigInt(participant.totalyesshares) + BigInt(amount)).toString();
        } else {
          // Bought NO shares
          participant.totalnoshares = (BigInt(participant.totalnoshares) + BigInt(amount)).toString();
        }
        
        participant.totalinvestment = (BigInt(participant.totalinvestment) + BigInt(amount)).toString();
        participant.transactionhashes.push(event.transactionHash);

        // Update timestamps
        const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
        const timestamp = new Date(Number(block.timestamp) * 1000).toISOString();
        
        if (!participant.firstpurchaseat) {
          participant.firstpurchaseat = timestamp;
        }
        participant.lastpurchaseat = timestamp;

      } catch (error) {
        console.error('❌ Error processing event:', error);
      }
    }

    // Clear existing participants
    console.log('🗑️ Clearing existing participants...');
    const { error: deleteError } = await supabase
      .from('market_participants')
      .delete()
      .neq('id', 'dummy'); // Delete all records

    if (deleteError) {
      console.warn('⚠️ Warning: Could not clear existing participants:', deleteError.message);
    }

    // Insert participant data
    console.log('💾 Inserting participant data...');
    let totalParticipants = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const [marketId, participants] of participantMap) {
      const participantArray = Array.from(participants.values());
      
      if (participantArray.length > 0) {
        try {
          const { error: insertError } = await supabase
            .from('market_participants')
            .insert(participantArray.map(p => ({
              ...p,
              marketid: marketId
            })));

          if (insertError) {
            console.error(`❌ Error inserting participants for market ${marketId}:`, insertError);
            errorCount++;
          } else {
            totalParticipants += participantArray.length;
            successCount++;
            console.log(`✅ Inserted ${participantArray.length} participants for market ${marketId}`);
          }
        } catch (error) {
          console.error(`❌ Exception inserting participants for market ${marketId}:`, error);
          errorCount++;
        }
      }
    }

    console.log(`🎉 Historical data sync completed!`);
    console.log(`📊 Total participants: ${totalParticipants}`);
    console.log(`✅ Successful markets: ${successCount}`);
    console.log(`❌ Failed markets: ${errorCount}`);

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Historical event fetch completed');
  }
}

fetchHistoricalEvents();

