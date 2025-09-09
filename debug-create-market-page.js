#!/usr/bin/env node

const { createPublicClient, http } = require('viem');
const { celo } = require('viem/chains');

// Load environment variables
require('dotenv').config();

const PREDICTION_MARKET_CORE_ADDRESS = '0x7176D16D61A122231a78749c61740ad8F86BB13a';

// Create public client
const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org')
});

async function debugCreateMarketPage() {
  console.log('🔍 Debugging create market page flow...');
  
  try {
    // Get the latest MarketCreated event
    console.log('\n1️⃣ Finding latest MarketCreated event...');
    
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = currentBlock - 1000n;
    
    const marketCreatedEvents = await publicClient.getLogs({
      address: PREDICTION_MARKET_CORE_ADDRESS,
      event: {
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
      fromBlock: fromBlock,
      toBlock: currentBlock
    });
    
    if (marketCreatedEvents.length === 0) {
      console.log('❌ No MarketCreated events found');
      return;
    }
    
    const latestEvent = marketCreatedEvents[marketCreatedEvents.length - 1];
    console.log('📝 Latest MarketCreated event:');
    console.log('  Block:', Number(latestEvent.blockNumber));
    console.log('  TX:', latestEvent.transactionHash);
    console.log('  Market ID:', Number(latestEvent.args.marketId));
    console.log('  Question:', latestEvent.args.question);
    console.log('  Creator:', latestEvent.args.creator);
    
    // Test the exact flow from create market page
    console.log('\n2️⃣ Testing create market page flow...');
    
    const txHash = latestEvent.transactionHash;
    const marketId = Number(latestEvent.args.marketId);
    
    // Simulate the useEffect logic from create market page
    console.log('🔄 Simulating useEffect logic...');
    
    // Step 1: Extract market ID
    console.log('  Step 1: Extracting market ID...');
    try {
      const extractResponse = await fetch('http://localhost:3000/api/extract-market-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionHash: txHash })
      });
      
      if (!extractResponse.ok) {
        console.error('    ❌ Extract market ID failed:', extractResponse.status);
        return;
      }
      
      const { marketId: extractedId } = await extractResponse.json();
      console.log('    ✅ Market ID extracted:', extractedId);
      
      if (parseInt(extractedId) !== marketId) {
        console.error('    ❌ Market ID mismatch!');
        console.log('      Expected:', marketId);
        console.log('      Got:', extractedId);
        return;
      }
      
    } catch (error) {
      console.error('    ❌ Extract market ID error:', error.message);
      return;
    }
    
    // Step 2: Create market data
    console.log('  Step 2: Creating market data...');
    
    const endDateTime = new Date();
    endDateTime.setDate(endDateTime.getDate() + 1);
    const endTimestamp = Math.floor(endDateTime.getTime() / 1000);
    
    const marketData = {
      id: marketId,
      question: latestEvent.args.question,
      description: latestEvent.args.description,
      category: 'Test',
      image: 'https://picsum.photos/400/300?random=4',
      source: latestEvent.args.source,
      endtime: endTimestamp.toString(),
      totalpool: '0',
      totalyes: '0',
      totalno: '0',
      status: 0,
      outcome: false,
      createdat: Math.floor(Date.now() / 1000).toString(),
      creator: latestEvent.args.creator
    };
    
    console.log('    📝 Market data prepared');
    
    // Step 3: Save to database
    console.log('  Step 3: Saving to database...');
    try {
      const updateResponse = await fetch('http://localhost:3000/api/markets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: marketData.id,
          type: 'create',
          data: marketData
        })
      });
      
      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        console.error('    ❌ Save market failed:', updateResponse.status, error);
        return;
      }
      
      const result = await updateResponse.json();
      console.log('    ✅ Market saved:', result.message);
      
    } catch (error) {
      console.error('    ❌ Save market error:', error.message);
      return;
    }
    
    console.log('\n✅ Create market page flow test completed successfully!');
    console.log('💡 The issue might be in the frontend timing or state management.');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugCreateMarketPage()
  .then(() => {
    console.log('✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
