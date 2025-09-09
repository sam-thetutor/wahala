const { createPublicClient, http } = require('viem');
const { celo } = require('@reown/appkit/networks');

const client = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org')
});

// Correct ABI based on the actual contract structure
const PREDICTION_MARKET_CORE_ABI = [
  {
    inputs: [],
    name: 'getMarketCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'marketId', type: 'uint256' }],
    name: 'getMarket',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'string', name: 'question', type: 'string' },
          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
          { internalType: 'uint256', name: 'totalPool', type: 'uint256' },
          { internalType: 'uint256', name: 'totalYes', type: 'uint256' },
          { internalType: 'uint256', name: 'totalNo', type: 'uint256' },
          { internalType: 'enum PredictionMarketCore.MarketStatus', name: 'status', type: 'uint8' },
          { internalType: 'bool', name: 'outcome', type: 'bool' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'address', name: 'creator', type: 'address' }
        ],
        internalType: 'struct PredictionMarketCore.Market',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'marketId', type: 'uint256' }],
    name: 'getMarketMetadata',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'string', name: 'category', type: 'string' },
          { internalType: 'string', name: 'image', type: 'string' },
          { internalType: 'string', name: 'source', type: 'string' }
        ],
        internalType: 'struct PredictionMarketCore.MarketMetadata',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

async function testContractStructure() {
  try {
    console.log('🔍 Testing contract structure...');
    
    const marketCount = await client.readContract({
      address: '0x2D6614fe45da6Aa7e60077434129a51631AC702A',
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketCount'
    });
    
    console.log('✅ Market count:', marketCount.toString());
    
    if (Number(marketCount) > 0) {
      console.log('\n🔍 Testing first few markets...');
      
      for (let i = 1; i <= Math.min(Number(marketCount), 3); i++) {
        try {
          const market = await client.readContract({
            address: '0x2D6614fe45da6Aa7e60077434129a51631AC702A',
            abi: PREDICTION_MARKET_CORE_ABI,
            functionName: 'getMarket',
            args: [BigInt(i)]
          });
          
          console.log(`\n📊 Market ${i}:`, {
            id: market.id.toString(),
            question: market.question.substring(0, 50) + '...',
            totalPool: market.totalPool.toString(),
            totalYes: market.totalYes.toString(),
            totalNo: market.totalNo.toString(),
            status: market.status,
            creator: market.creator,
            endTime: new Date(Number(market.endTime) * 1000).toISOString()
          });
          
          // Test metadata
          const metadata = await client.readContract({
            address: '0x2D6614fe45da6Aa7e60077434129a51631AC702A',
            abi: PREDICTION_MARKET_CORE_ABI,
            functionName: 'getMarketMetadata',
            args: [BigInt(i)]
          });
          
          console.log(`📝 Metadata ${i}:`, {
            description: metadata.description.substring(0, 50) + '...',
            category: metadata.category,
            image: metadata.image,
            source: metadata.source.substring(0, 50) + '...'
          });
          
        } catch (error) {
          console.log(`❌ Error fetching market ${i}:`, error.message);
        }
      }
    }
    
    // Calculate total volume
    console.log('\n💰 Calculating total volume...');
    let totalVolume = 0n;
    let activeMarkets = 0;
    
    for (let i = 1; i <= Number(marketCount); i++) {
      try {
        const market = await client.readContract({
          address: '0x2D6614fe45da6Aa7e60077434129a51631AC702A',
          abi: PREDICTION_MARKET_CORE_ABI,
          functionName: 'getMarket',
          args: [BigInt(i)]
        });
        
        if (market.question && market.question.length > 0) {
          activeMarkets++;
          totalVolume += market.totalPool;
        }
      } catch (error) {
        // Skip invalid markets
      }
    }
    
    console.log('\n📈 Summary:', {
      totalMarkets: marketCount.toString(),
      activeMarkets,
      totalVolume: (Number(totalVolume) / 1e18).toFixed(6) + ' CELO'
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testContractStructure();
