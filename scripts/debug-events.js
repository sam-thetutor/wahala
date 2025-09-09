require('dotenv').config();
const { createPublicClient, http } = require('viem');
const { celo } = require('viem/chains');

const PREDICTION_MARKET_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';

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

async function debugEvents() {
  console.log('🔍 Debugging event structure...');

  try {
    // Get a few recent events to see their structure
    const events = await publicClient.getLogs({
      address: PREDICTION_MARKET_ADDRESS,
      event: MARKET_ABI[0],
      fromBlock: 45190000n,
      toBlock: 45196900n
    });

    console.log(`📊 Found ${events.length} events`);

    for (let i = 0; i < Math.min(events.length, 3); i++) {
      const event = events[i];
      console.log(`\n📋 Event ${i + 1}:`);
      console.log('Raw event:', JSON.stringify(event, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2));
      
      // Try to parse the event
      try {
        const parsed = publicClient.parseEventLogs({
          abi: MARKET_ABI,
          logs: [event]
        });
        console.log('Parsed event:', JSON.stringify(parsed, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value, 2));
      } catch (parseError) {
        console.log('Parse error:', parseError.message);
      }

      // Try manual parsing
      try {
        const { marketId, buyer, side, amount } = event.args || {};
        console.log('Manual args:', { marketId, buyer, side, amount });
      } catch (manualError) {
        console.log('Manual parse error:', manualError.message);
      }
    }

  } catch (error) {
    console.error('❌ Error debugging events:', error);
  }
}

debugEvents();
