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

console.log('🚀 Testing Prediction Market ABI (Focused)...');
console.log('📋 Contract Address:', CONTRACT_ADDRESS);
console.log('🔗 RPC URL:', CELO_RPC_URL);

// Create public client
const publicClient = createPublicClient({
  chain: celo,
  transport: http(CELO_RPC_URL),
});

async function testFocusedABI() {
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
      console.log('⚠️  No markets found.');
      return;
    }
    
    // Test 2: Get all markets and calculate total volume
    console.log('\n📊 Test 2: Getting all markets and calculating volume...');
    let totalVolume = 0n;
    let activeMarkets = 0;
    let resolvedMarkets = 0;
    
    for (let i = 0; i < marketCount; i++) {
      try {
        const market = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PREDICTION_MARKET_CORE_ABI,
          functionName: 'getMarket',
          args: [i],
        });
        
        const marketData = {
          id: market[0]?.toString() || '0',
          question: market[1] || '',
          endTime: market[2]?.toString() || '0',
          totalPool: market[3] || 0n,
          totalYes: market[4] || 0n,
          totalNo: market[5] || 0n,
          status: market[6] || 0,
          outcome: market[7] || false,
          createdAt: market[8]?.toString() || '0',
          creator: market[9] || '0x0',
        };
        
        // Only count markets with actual data
        if (marketData.question && marketData.question.length > 0) {
          totalVolume += marketData.totalPool;
          
          if (marketData.status === 0) {
            activeMarkets++;
          } else if (marketData.status === 1) {
            resolvedMarkets++;
          }
          
          console.log(`✅ Market ${i}:`, {
            id: marketData.id,
            question: marketData.question.substring(0, 50) + '...',
            totalPool: formatEther(marketData.totalPool),
            status: marketData.status,
            creator: marketData.creator,
          });
        }
      } catch (error) {
        console.log(`❌ Error fetching market ${i}:`, error.message);
      }
    }
    
    console.log('\n📈 Volume Summary:');
    console.log(`- Total markets with data: ${activeMarkets + resolvedMarkets}`);
    console.log(`- Active markets: ${activeMarkets}`);
    console.log(`- Resolved markets: ${resolvedMarkets}`);
    console.log(`- Total volume: ${formatEther(totalVolume)} CELO`);
    
    // Test 3: Get contract configuration
    console.log('\n📊 Test 3: Getting contract configuration...');
    
    const creationFee = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'getMarketCreationFee',
    });
    
    const creatorFeePercentage = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'creatorFeePercentage',
    });
    
    const owner = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'owner',
    });
    
    const claimsContract = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'claimsContract',
    });
    
    console.log('✅ Contract configuration:', {
      creationFee: formatEther(creationFee) + ' CELO',
      creatorFeePercentage: creatorFeePercentage.toString() + '%',
      owner: owner,
      claimsContract: claimsContract,
    });
    
    // Test 4: Test username functions
    console.log('\n📊 Test 4: Testing username functions...');
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
    
    console.log('\n🎉 ABI test completed successfully!');
    console.log('\n📊 Final Summary:');
    console.log(`- Total markets: ${marketCount.toString()}`);
    console.log(`- Markets with data: ${activeMarkets + resolvedMarkets}`);
    console.log(`- Active markets: ${activeMarkets}`);
    console.log(`- Resolved markets: ${resolvedMarkets}`);
    console.log(`- Total volume: ${formatEther(totalVolume)} CELO`);
    console.log(`- Creation fee: ${formatEther(creationFee)} CELO`);
    console.log(`- Creator fee: ${creatorFeePercentage.toString()}%`);
    console.log(`- Contract owner: ${owner}`);
    console.log(`- Claims contract: ${claimsContract}`);
    
  } catch (error) {
    console.error('❌ ABI test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
    });
  }
}

// Run the test
testFocusedABI().catch(console.error);
