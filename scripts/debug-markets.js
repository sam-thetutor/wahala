const { createPublicClient, http, formatEther } = require('viem');
const { celo } = require('viem/chains');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let CONTRACT_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=')) {
      CONTRACT_ADDRESS = line.split('=')[1].trim();
      break;
    }
  }
}

const { PREDICTION_MARKET_CORE_ABI } = require('../contracts/contracts.js');

const CELO_RPC_URL = 'https://forno.celo.org';

console.log('🔍 DEBUGGING MARKETS - Detailed Analysis');
console.log('📋 Contract Address:', CONTRACT_ADDRESS);

const publicClient = createPublicClient({
  chain: celo,
  transport: http(CELO_RPC_URL),
});

async function debugMarkets() {
  try {
    // Get market count
    const marketCount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketCount',
    });
    
    console.log('\n📊 Market Count:', marketCount.toString());
    
    // Check if there's a markets mapping function
    console.log('\n🔍 Checking markets mapping...');
    
    // Try to get market 0 directly
    console.log('\n📋 Getting Market 0 directly:');
    const market0 = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarket',
      args: [0],
    });
    
    console.log('Raw market 0 data:', market0);
    console.log('Market 0 details:', {
      id: market0[0]?.toString(),
      question: market0[1],
      endTime: market0[2]?.toString(),
      totalPool: market0[3]?.toString(),
      totalYes: market0[4]?.toString(),
      totalNo: market0[5]?.toString(),
      status: market0[6],
      outcome: market0[7],
      createdAt: market0[8]?.toString(),
      creator: market0[9],
    });
    
    // Try to get market 1
    console.log('\n📋 Getting Market 1 directly:');
    const market1 = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarket',
      args: [1],
    });
    
    console.log('Raw market 1 data:', market1);
    console.log('Market 1 details:', {
      id: market1[0]?.toString(),
      question: market1[1],
      endTime: market1[1]?.toString(),
      totalPool: market1[3]?.toString(),
      totalYes: market1[4]?.toString(),
      totalNo: market1[5]?.toString(),
      status: market1[6],
      outcome: market1[7],
      createdAt: market1[8]?.toString(),
      creator: market1[9],
    });
    
    // Check if there's a markets mapping
    console.log('\n🔍 Checking markets mapping function...');
    try {
      const marketsMapping = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PREDICTION_MARKET_CORE_ABI,
        functionName: 'markets',
        args: [0],
      });
      
      console.log('Markets mapping for index 0:', marketsMapping);
    } catch (error) {
      console.log('❌ Markets mapping function failed:', error.message);
    }
    
    // Check events to see if markets were created
    console.log('\n🔍 Checking for MarketCreated events...');
    try {
      const currentBlock = await publicClient.getBlockNumber();
      console.log('Current block:', currentBlock.toString());
      
      // Get events from the last 1000 blocks
      const fromBlock = currentBlock - 1000n;
      
      const events = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: {
          type: 'event',
          name: 'MarketCreated',
          inputs: [
            { indexed: true, name: 'marketId', type: 'uint256' },
            { indexed: true, name: 'creator', type: 'address' },
            { indexed: false, name: 'question', type: 'string' },
            { indexed: false, name: 'description', type: 'string' },
            { indexed: false, name: 'source', type: 'string' },
            { indexed: false, name: 'endTime', type: 'uint256' },
            { indexed: false, name: 'creationFee', type: 'uint256' }
          ]
        },
        fromBlock: fromBlock,
        toBlock: currentBlock
      });
      
      console.log('MarketCreated events found:', events.length);
      events.forEach((event, i) => {
        console.log(`Event ${i}:`, {
          marketId: event.args.marketId?.toString(),
          creator: event.args.creator,
          question: event.args.question,
          endTime: event.args.endTime?.toString(),
          creationFee: event.args.creationFee?.toString()
        });
      });
    } catch (error) {
      console.log('❌ Error getting events:', error.message);
    }
    
    // Try a different approach - check if markets are 1-indexed
    console.log('\n🔍 Trying 1-indexed markets...');
    try {
      const market1Indexed = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PREDICTION_MARKET_CORE_ABI,
        functionName: 'getMarket',
        args: [1], // Try 1 instead of 0
      });
      
      console.log('Market 1 (1-indexed) details:', {
        id: market1Indexed[0]?.toString(),
        question: market1Indexed[1],
        endTime: market1Indexed[2]?.toString(),
        totalPool: market1Indexed[3]?.toString(),
        totalYes: market1Indexed[4]?.toString(),
        totalNo: market1Indexed[5]?.toString(),
        status: market1Indexed[6],
        outcome: market1Indexed[7],
        createdAt: market1Indexed[8]?.toString(),
        creator: market1Indexed[9],
      });
    } catch (error) {
      console.log('❌ Error getting market 1:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugMarkets().catch(console.error);
