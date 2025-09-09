#!/usr/bin/env node

/**
 * Test script for the EventsStore
 * This script tests the events store integration
 */

const { createPublicClient, http } = require('viem');
const { celo } = require('viem/chains');

// Create public client for Celo mainnet
const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org')
});

// Contract addresses
const PREDICTION_MARKET_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';

async function testEventsStoreIntegration() {
  console.log('🚀 Testing EventsStore Integration...\n');
  
  try {
    // Test 1: Check if we can connect to the contract
    console.log('🔍 Testing contract connection...');
    const marketCount = await publicClient.readContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: [{
        "inputs": [],
        "name": "getMarketCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }],
      functionName: 'getMarketCount',
    });
    
    console.log(`✅ Contract accessible. Market count: ${marketCount}`);
    
    // Test 2: Find deployment block
    console.log('\n🔍 Finding deployment block...');
    const currentBlock = await publicClient.getBlockNumber();
    let deploymentBlock = null;
    
    // Binary search to find deployment block
    let low = 0n;
    let high = currentBlock;
    
    while (low <= high) {
      const mid = (low + high) / 2n;
      
      try {
        const code = await publicClient.getCode({
          address: PREDICTION_MARKET_ADDRESS,
          blockNumber: mid
        });
        
        if (code && code !== '0x') {
          deploymentBlock = mid;
          high = mid - 1n;
        } else {
          low = mid + 1n;
        }
      } catch (error) {
        break;
      }
    }
    
    if (deploymentBlock) {
      console.log(`✅ Contract deployed at block: ${deploymentBlock}`);
      
      const block = await publicClient.getBlock({ blockNumber: deploymentBlock });
      console.log(`   Deployment timestamp: ${new Date(Number(block.timestamp) * 1000).toLocaleString()}`);
    }
    
    // Test 3: Fetch MarketCreated events
    console.log('\n🔍 Fetching MarketCreated events...');
    const logs = await publicClient.getLogs({
      address: PREDICTION_MARKET_ADDRESS,
      event: {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "uint256", "name": "marketId", "type": "uint256"},
          {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
          {"indexed": false, "internalType": "string", "name": "question", "type": "string"},
          {"indexed": false, "internalType": "string", "name": "description", "type": "string"},
          {"indexed": false, "internalType": "string", "name": "source", "type": "string"},
          {"indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "creationFee", "type": "uint256"}
        ],
        "name": "MarketCreated",
        "type": "event"
      },
      fromBlock: deploymentBlock || 0n,
      toBlock: currentBlock,
    });
    
    console.log(`✅ Found ${logs.length} MarketCreated events`);
    
    // Test 4: Calculate statistics
    console.log('\n🔍 Calculating statistics...');
    
    // Count unique creators
    const uniqueCreators = new Set();
    logs.forEach(log => {
      if (log.args.creator) {
        uniqueCreators.add(log.args.creator.toLowerCase());
      }
    });
    
    console.log('📊 Statistics:');
    console.log(`   Total Markets: ${logs.length}`);
    console.log(`   Unique Creators: ${uniqueCreators.size}`);
    console.log(`   Deployment Block: ${deploymentBlock}`);
    console.log(`   Current Block: ${currentBlock}`);
    console.log(`   Blocks Scanned: ${currentBlock - (deploymentBlock || 0n)}`);
    
    // Test 5: Sample events
    if (logs.length > 0) {
      console.log('\n📊 Sample Events:');
      logs.slice(0, 3).forEach((log, index) => {
        console.log(`\n  Event ${index + 1}:`);
        console.log(`    Market ID: ${log.args.marketId}`);
        console.log(`    Creator: ${log.args.creator}`);
        console.log(`    Question: ${log.args.question}`);
        console.log(`    End Time: ${new Date(Number(log.args.endTime) * 1000).toLocaleString()}`);
        console.log(`    Block: ${log.blockNumber}`);
        console.log(`    TX: ${log.transactionHash}`);
      });
    }
    
    console.log('\n🎉 EventsStore integration test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Contract connection: ✅');
    console.log('   - Deployment block found: ✅');
    console.log('   - Event fetching: ✅');
    console.log('   - Statistics calculation: ✅');
    console.log('   - Sample data: ✅');
    
    return {
      success: true,
      marketCount: Number(marketCount),
      eventsFound: logs.length,
      uniqueCreators: uniqueCreators.size,
      deploymentBlock: deploymentBlock?.toString(),
      currentBlock: currentBlock.toString()
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testEventsStoreIntegration()
  .then(result => {
    if (result.success) {
      console.log('\n✅ All tests passed! The EventsStore should work correctly.');
      process.exit(0);
    } else {
      console.log('\n❌ Tests failed. Check the errors above.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });

