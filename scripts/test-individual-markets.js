const { createPublicClient, http, formatEther } = require('viem');
const { celo } = require('viem/chains');

const { PREDICTION_MARKET_CORE_ABI } = require('../contracts/contracts.js');

const CELO_RPC_URL = 'https://forno.celo.org';
const CONTRACT_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';

console.log('🔍 Testing Individual Markets');

const publicClient = createPublicClient({
  chain: celo,
  transport: http(CELO_RPC_URL),
});

async function testIndividualMarkets() {
  try {
    // Test markets 1-10 individually
    for (let i = 1; i <= 10; i++) {
      try {
        const market = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PREDICTION_MARKET_CORE_ABI,
          functionName: 'getMarket',
          args: [i],
        });
        
        const metadata = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PREDICTION_MARKET_CORE_ABI,
          functionName: 'getMarketMetadata',
          args: [i],
        });
        
        console.log(`\n📋 Market ${i}:`);
        console.log('Raw market:', market);
        console.log('Raw metadata:', metadata);
        console.log('Details:', {
          id: market[0]?.toString(),
          question: market[1],
          endTime: market[2]?.toString(),
          totalPool: market[3]?.toString(),
          totalYes: market[4]?.toString(),
          totalNo: market[5]?.toString(),
          status: market[6],
          outcome: market[7],
          createdAt: market[8]?.toString(),
          creator: market[9],
          description: metadata[0],
          category: metadata[1],
          image: metadata[2],
          source: metadata[3],
        });
        
        if (market[1] && market[1].length > 0) {
          console.log('✅ FOUND REAL MARKET!');
          break;
        }
      } catch (error) {
        console.log(`❌ Error getting market ${i}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testIndividualMarkets().catch(console.error);
