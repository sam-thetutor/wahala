const { createPublicClient, http, formatEther, parseEther } = require('viem');
t backe the trconst { celo } = require('viem/chains');
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

console.log('🚀 Testing Prediction Market ABI...');
console.log('📋 Contract Address:', CONTRACT_ADDRESS);
console.log('🔗 RPC URL:', CELO_RPC_URL);

// Create public client
const publicClient = createPublicClient({
  chain: celo,
  transport: http(CELO_RPC_URL),
});

async function testABI() {
  try {
    console.log('\n🔍 Testing basic contract connection...');
    
    // Test 1: Get market count
    console.log('\n📊 Test 1: Getting market count...');
    const marketCount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketCount',
    });
    
    console.log('✅ Market count:', marketCount.toString());
    
    if (marketCount === 0n) {
      console.log('⚠️  No markets found. Testing with market creation...');
      return;
    }
    
    // Test 2: Get individual market data
    console.log('\n📊 Test 2: Getting individual market data...');
    const marketId = 0n; // Test with first market
    
    const market = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarket',
      args: [marketId],
    });
    
    console.log('✅ Market data:', {
      id: market[0]?.toString() || 'N/A',
      question: market[1] || 'N/A',
      endTime: market[2]?.toString() || 'N/A',
      totalPool: market[3] ? formatEther(market[3]) : 'N/A',
      totalYes: market[4] ? formatEther(market[4]) : 'N/A',
      totalNo: market[5] ? formatEther(market[5]) : 'N/A',
      status: market[6] || 'N/A',
      outcome: market[7] || 'N/A',
      createdAt: market[8]?.toString() || 'N/A',
      creator: market[9] || 'N/A',
    });
    
    console.log('🔍 Raw market data:', market);
    
    // Test 3: Get market metadata
    console.log('\n📊 Test 3: Getting market metadata...');
    const metadata = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketMetadata',
      args: [marketId],
    });
    
    console.log('✅ Market metadata:', {
      description: metadata[0] || 'N/A',
      category: metadata[1] || 'N/A',
      image: metadata[2] || 'N/A',
      source: metadata[3] || 'N/A',
    });
    
    console.log('🔍 Raw metadata data:', metadata);
    
    // Test 4: Get market creation fee
    console.log('\n📊 Test 4: Getting market creation fee...');
    const creationFee = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketCreationFee',
    });
    
    console.log('✅ Market creation fee:', formatEther(creationFee), 'CELO');
    
    // Test 5: Get creator fee percentage
    console.log('\n📊 Test 5: Getting creator fee percentage...');
    const creatorFeePercentage = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'creatorFeePercentage',
    });
    
    console.log('✅ Creator fee percentage:', creatorFeePercentage.toString(), '%');
    
    // Test 6: Get username change fee
    console.log('\n📊 Test 6: Getting username change fee...');
    const usernameChangeFee = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'usernameChangeFee',
    });
    
    console.log('✅ Username change fee:', formatEther(usernameChangeFee), 'CELO');
    
    // Test 7: Get owner
    console.log('\n📊 Test 7: Getting contract owner...');
    const owner = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'owner',
    });
    
    console.log('✅ Contract owner:', owner);
    
    // Test 8: Get claims contract
    console.log('\n📊 Test 8: Getting claims contract address...');
    const claimsContract = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'claimsContract',
    });
    
    console.log('✅ Claims contract:', claimsContract);
    
    // Test 9: Test with multiple markets if available
    if (marketCount > 1n) {
      console.log('\n📊 Test 9: Testing multiple markets...');
      const maxMarkets = marketCount > 5n ? 5n : marketCount;
      
      for (let i = 0; i < maxMarkets; i++) {
        try {
          const market = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: PREDICTION_MARKET_CORE_ABI,
            functionName: 'getMarket',
            args: [i],
          });
          
          console.log(`✅ Market ${i}:`, {
            id: market[0].toString(),
            question: market[1].substring(0, 50) + '...',
            totalPool: formatEther(market[3]),
            status: market[6],
            creator: market[9],
          });
        } catch (error) {
          console.log(`❌ Error fetching market ${i}:`, error.message);
        }
      }
    }
    
    // Test 10: Test username functions
    console.log('\n📊 Test 10: Testing username functions...');
    try {
      const isAvailable = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PREDICTION_MARKET_CORE_ABI,
        functionName: 'isUsernameAvailable',
        args: ['testuser123'],
      });
      
      console.log('✅ Username availability check:', isAvailable);
    } catch (error) {
      console.log('❌ Error checking username availability:', error.message);
    }
    
    console.log('\n🎉 All ABI tests completed successfully!');
    console.log('\n📈 Summary:');
    console.log(`- Total markets: ${marketCount.toString()}`);
    console.log(`- Contract owner: ${owner}`);
    console.log(`- Claims contract: ${claimsContract}`);
    console.log(`- Creation fee: ${formatEther(creationFee)} CELO`);
    console.log(`- Creator fee: ${creatorFeePercentage.toString()}%`);
    console.log(`- Username change fee: ${formatEther(usernameChangeFee)} CELO`);
    
  } catch (error) {
    console.error('❌ ABI test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      cause: error.cause,
    });
  }
}

// Run the test
testABI().catch(console.error);
