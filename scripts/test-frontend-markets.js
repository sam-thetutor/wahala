const { createPublicClient, http, formatEther } = require('viem');
const { celo } = require('viem/chains');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let CONTRACT_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A'; // Default fallback

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

// Import the ABI from the compiled JavaScript
const { PREDICTION_MARKET_CORE_ABI } = require('../contracts/contracts.js');

const CELO_RPC_URL = 'https://forno.celo.org';

console.log('🚀 Testing Frontend Market Fetching...');
console.log('📋 Contract Address:', CONTRACT_ADDRESS);
console.log('🔗 RPC URL:', CELO_RPC_URL);

// Create public client
const publicClient = createPublicClient({
  chain: celo,
  transport: http(CELO_RPC_URL),
});

async function testFrontendMarkets() {
  try {
    console.log('\n🔍 Testing market fetching like the frontend...');
    
    // Step 1: Get market count (like useMarkets hook)
    console.log('\n📊 Step 1: Getting market count...');
    const marketCount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketCount',
    });
    
    console.log('✅ Market count:', marketCount.toString());
    
    if (marketCount === 0n) {
      console.log('⚠️  No markets found.');
      return;
    }
    
    // Step 2: Get all markets (like useReadContracts)
    console.log('\n📊 Step 2: Getting all markets...');
    const marketPromises = [];
    const metadataPromises = [];
    
    for (let i = 0; i < marketCount; i++) {
      marketPromises.push(
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PREDICTION_MARKET_CORE_ABI,
          functionName: 'getMarket',
          args: [i + 1], // Markets are 1-indexed!
        })
      );
      
      metadataPromises.push(
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PREDICTION_MARKET_CORE_ABI,
          functionName: 'getMarketMetadata',
          args: [i + 1], // Markets are 1-indexed!
        })
      );
    }
    
    const marketResults = await Promise.all(marketPromises);
    const metadataResults = await Promise.all(metadataPromises);
    
    console.log('✅ Fetched', marketResults.length, 'markets and', metadataResults.length, 'metadata');
    
    // Step 3: Process markets (like useMarkets hook)
    console.log('\n📊 Step 3: Processing markets...');
    const processedMarkets = [];
    let totalVolume = 0n;
    let marketsWithData = 0;
    let marketsWithVolume = 0;
    
    for (let i = 0; i < marketResults.length; i++) {
      const market = marketResults[i];
      const metadata = metadataResults[i];
      
      const processedMarket = {
        id: market.id || BigInt(0),
        question: market.question || '',
        endTime: market.endTime || BigInt(0),
        totalPool: market.totalPool || BigInt(0),
        totalYes: market.totalYes || BigInt(0),
        totalNo: market.totalNo || BigInt(0),
        status: market.status || 0,
        outcome: market.outcome || false,
        createdAt: market.createdAt || BigInt(0),
        creator: market.creator || '0x0',
        description: metadata.description || '',
        category: metadata.category || '',
        image: metadata.image || '',
        source: metadata.source || ''
      };
      
      processedMarkets.push(processedMarket);
      totalVolume += processedMarket.totalPool;
      
      if (processedMarket.question && processedMarket.question.length > 0) {
        marketsWithData++;
      }
      
      if (processedMarket.totalPool > 0n) {
        marketsWithVolume++;
      }
      
      // Show first few markets
      if (i < 5) {
        console.log(`📋 Market ${i}:`, {
          id: processedMarket.id.toString(),
          question: processedMarket.question.substring(0, 50) + (processedMarket.question.length > 50 ? '...' : ''),
          totalPool: formatEther(processedMarket.totalPool),
          status: processedMarket.status,
          creator: processedMarket.creator,
          hasData: processedMarket.question.length > 0,
          hasVolume: processedMarket.totalPool > 0n
        });
      }
    }
    
    console.log('\n📈 Frontend Market Summary:');
    console.log(`- Total markets: ${processedMarkets.length}`);
    console.log(`- Markets with data: ${marketsWithData}`);
    console.log(`- Markets with volume: ${marketsWithVolume}`);
    console.log(`- Total volume: ${formatEther(totalVolume)} CELO`);
    console.log(`- Average volume per market: ${formatEther(totalVolume / BigInt(processedMarkets.length))} CELO`);
    
    // Step 4: Test volume calculation (like homepage)
    console.log('\n📊 Step 4: Testing volume calculation...');
    const marketVolume = processedMarkets.reduce((sum, m) => sum + (m.totalPool || 0n), 0n);
    console.log('✅ Market-based volume:', formatEther(marketVolume), 'CELO');
    
    if (marketVolume === 0n) {
      console.log('⚠️  No volume found in markets - this explains why homepage shows 0');
    } else {
      console.log('✅ Volume found in markets - homepage should display this');
    }
    
    console.log('\n🎉 Frontend market test completed!');
    
  } catch (error) {
    console.error('❌ Frontend market test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
    });
  }
}

// Run the test
testFrontendMarkets().catch(console.error);
