const { createPublicClient, http, formatEther } = require('viem');
const { celo } = require('viem/chains');

const { PREDICTION_MARKET_CORE_ABI } = require('../contracts/contracts.js');

const CELO_RPC_URL = 'https://forno.celo.org';
const CONTRACT_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';

console.log('🔍 Testing Tuple Structure');

const publicClient = createPublicClient({
  chain: celo,
  transport: http(CELO_RPC_URL),
});

async function testTupleStructure() {
  try {
    const market = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarket',
      args: [1],
    });
    
    const metadata = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketMetadata',
      args: [1],
    });
    
    console.log('Raw market type:', typeof market);
    console.log('Raw market constructor:', market.constructor.name);
    console.log('Raw market keys:', Object.keys(market));
    console.log('Raw market values:', Object.values(market));
    console.log('Raw market length:', market.length);
    console.log('Is array:', Array.isArray(market));
    
    console.log('\nRaw metadata type:', typeof metadata);
    console.log('Raw metadata constructor:', metadata.constructor.name);
    console.log('Raw metadata keys:', Object.keys(metadata));
    console.log('Raw metadata values:', Object.values(metadata));
    console.log('Raw metadata length:', metadata.length);
    console.log('Is array:', Array.isArray(metadata));
    
    console.log('\nTesting access methods:');
    console.log('market[0]:', market[0]);
    console.log('market.id:', market.id);
    console.log('market.question:', market.question);
    console.log('market.totalPool:', market.totalPool);
    
    console.log('\nmetadata[0]:', metadata[0]);
    console.log('metadata.description:', metadata.description);
    console.log('metadata.category:', metadata.category);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTupleStructure().catch(console.error);
