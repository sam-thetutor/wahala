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

async function syncWithParticipants() {
  console.log('🚀 Starting sync with participant data...');

  try {
    // First, check if participant table exists
    const { data: participants, error: tableError } = await supabase
      .from('market_participants')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Participant table does not exist. Please run the SQL in setup-participant-table.sql first.');
      console.log('\n📋 Run this SQL in your Supabase SQL Editor:');
      console.log('```sql');
      const fs = require('fs');
      const sql = fs.readFileSync('scripts/setup-participant-table.sql', 'utf8');
      console.log(sql);
      console.log('```');
      return;
    }

    console.log('✅ Participant table exists');

    // Get market count
    const marketCount = await publicClient.readContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: [{ "inputs": [], "name": "getMarketCount", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }],
      functionName: 'getMarketCount'
    });

    console.log(`📊 Found ${Number(marketCount)} markets in contract`);

    // Get all SharesBought events
    console.log('🔍 Fetching all SharesBought events...');
    const sharesBoughtEvents = await publicClient.getLogs({
      address: PREDICTION_MARKET_ADDRESS,
      event: MARKET_ABI[0],
      fromBlock: 0n
    });

    console.log(`📊 Found ${sharesBoughtEvents.length} SharesBought events`);

    // Process events and build participant data
    const participantMap = new Map();

    for (const event of sharesBoughtEvents) {
      const { marketId, buyer, side, amount } = event.args;
      const marketIdStr = marketId.toString();
      const buyerStr = buyer.toLowerCase();
      const amountStr = amount.toString();

      if (!participantMap.has(marketIdStr)) {
        participantMap.set(marketIdStr, new Map());
      }

      const marketParticipants = participantMap.get(marketIdStr);
      
      if (!marketParticipants.has(buyerStr)) {
        marketParticipants.set(buyerStr, {
          address: buyerStr,
          totalYesShares: '0',
          totalNoShares: '0',
          totalInvestment: '0',
          transactionHashes: []
        });
      }

      const participant = marketParticipants.get(buyerStr);
      
      if (side) {
        // Bought YES shares
        participant.totalYesShares = (BigInt(participant.totalYesShares) + amount).toString();
      } else {
        // Bought NO shares
        participant.totalNoShares = (BigInt(participant.totalNoShares) + amount).toString();
      }
      
      participant.totalInvestment = (BigInt(participant.totalInvestment) + amount).toString();
      participant.transactionHashes.push(event.transactionHash);

      // Update timestamps
      const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
      const timestamp = new Date(Number(block.timestamp) * 1000).toISOString();
      
      if (!participant.firstPurchaseAt) {
        participant.firstPurchaseAt = timestamp;
      }
      participant.lastPurchaseAt = timestamp;
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

    for (const [marketId, participants] of participantMap) {
      const participantArray = Array.from(participants.values());
      
      if (participantArray.length > 0) {
        const { error: insertError } = await supabase
          .from('market_participants')
          .insert(participantArray.map(p => ({
            ...p,
            marketId: marketId
          })));

        if (insertError) {
          console.error(`❌ Error inserting participants for market ${marketId}:`, insertError);
        } else {
          totalParticipants += participantArray.length;
          console.log(`✅ Inserted ${participantArray.length} participants for market ${marketId}`);
        }
      }
    }

    console.log(`🎉 Sync completed! Total participants: ${totalParticipants}`);

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Sync with participants completed');
  }
}

syncWithParticipants();

