#!/usr/bin/env node

/**
 * Test script to verify volume calculation via API
 * 
 * This script tests the volume calculation by calling the markets API
 * and checking if the total volume is calculated correctly
 */

async function testVolumeCalculation() {
  console.log('🔍 Testing volume calculation via API...\n');

  try {
    // Test the markets API to get stats
    console.log('📊 Fetching market stats from API...');
    const response = await fetch('http://localhost:3000/api/markets?limit=1000');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const stats = data.stats;
    
    console.log('📈 Market Stats from API:');
    console.log(`   Total Markets: ${stats.totalMarkets}`);
    console.log(`   Active Markets: ${stats.activeMarkets}`);
    console.log(`   Resolved Markets: ${stats.resolvedMarkets}`);
    console.log(`   Total Volume: ${stats.totalVolume} wei`);
    console.log(`   Total Volume (CELO): ${(BigInt(stats.totalVolume) / BigInt(10**18)).toString()} CELO`);
    
    // Check if we have markets data
    console.log(`\n📊 Markets Data:`);
    console.log(`   Total Markets Returned: ${data.markets?.length || 0}`);
    
    if (data.markets && data.markets.length > 0) {
      // Calculate volume from pool sizes (old method)
      const poolVolume = data.markets.reduce((sum, market) => {
        return sum + BigInt(market.totalpool || '0');
      }, 0n);
      
      console.log(`   Pool-based Volume (old method): ${poolVolume.toString()} wei (${(poolVolume / BigInt(10**18)).toString()} CELO)`);
      
      // Show some sample markets
      console.log('\n📋 Sample Markets:');
      data.markets.slice(0, 3).forEach((market, index) => {
        console.log(`   Market ${index + 1}:`);
        console.log(`     ID: ${market.id}`);
        console.log(`     Question: ${market.question?.substring(0, 50)}...`);
        console.log(`     Pool: ${market.totalpool} wei (${(BigInt(market.totalpool) / BigInt(10**18)).toString()} CELO)`);
        console.log(`     Status: ${market.status === 0 ? 'Active' : market.status === 1 ? 'Resolved' : 'Unknown'}`);
      });
    }
    
    console.log('\n✅ Volume calculation test completed!');
    console.log('\n📝 Analysis:');
    console.log('   - If the API volume is higher than pool-based volume, the fix is working');
    console.log('   - If they are the same, the volume calculation might still be using pool sizes');
    console.log('   - Check the server logs for volume calculation debug information');
    
  } catch (error) {
    console.error('❌ Error testing volume calculation:', error);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

// Run the test
testVolumeCalculation();
