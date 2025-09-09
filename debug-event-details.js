// Debug script to check event details and signatures
const { createPublicClient, http, parseEventLogs } = require('viem');
const { celo } = require('viem/chains');

const debugEventDetails = async () => {
  console.log('🔍 Debugging event details and signatures...');

  try {
    // Initialize client
    const publicClient = createPublicClient({
      chain: celo,
      transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
    });

    const contractAddress = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';
    console.log('📋 Contract address:', contractAddress);

    // Check blocks around 45264666
    const targetBlock = 45264666n;
    const fromBlock = targetBlock - 5n;
    const toBlock = targetBlock + 5n;

    console.log(`🔍 Checking blocks ${fromBlock} to ${toBlock} for all events...`);

    // Get all events from this contract
    const allLogs = await publicClient.getLogs({
      address: contractAddress,
      fromBlock,
      toBlock
    });

    console.log(`📊 Found ${allLogs.length} total events from contract in range`);

    if (allLogs.length > 0) {
      console.log('\n📋 All events found:');
      allLogs.forEach((log, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log('  Block:', log.blockNumber);
        console.log('  Transaction:', log.transactionHash);
        console.log('  Topics:', log.topics);
        console.log('  Data:', log.data);
      });

      // Check for MarketCreated event signature
      console.log('\n🔍 Looking for MarketCreated event signature...');
      
      // MarketCreated event signature: MarketCreated(uint256,address,string,string,string,string,string[],uint256,uint8)
      // Let's calculate the signature
      const marketCreatedSignature = 'MarketCreated(uint256,address,string,string,string,string,string[],uint256,uint8)';
      console.log('📝 MarketCreated signature:', marketCreatedSignature);
      
      // Let's also check for any events that might be market-related
      const marketRelatedTopics = allLogs.filter(log => {
        // Look for events that might be market creation
        return log.topics.length >= 2; // Market events usually have at least 2 topics
      });

      console.log(`\n📊 Found ${marketRelatedTopics.length} events with multiple topics (potential market events)`);
      
      marketRelatedTopics.forEach((log, index) => {
        console.log(`\nPotential Market Event ${index + 1}:`);
        console.log('  Block:', log.blockNumber);
        console.log('  Transaction:', log.transactionHash);
        console.log('  Topics:', log.topics);
        console.log('  Data length:', log.data.length);
      });
    }

    // Let's also check the current block to see what's happening now
    console.log('\n🔍 Checking current block...');
    const currentBlock = await publicClient.getBlockNumber();
    console.log('📊 Current block:', currentBlock);

    // Check last 50 blocks for any MarketCreated events
    console.log('\n🔍 Checking last 50 blocks for MarketCreated events...');
    const recentFromBlock = currentBlock - 50n;
    const recentToBlock = currentBlock;

    const recentLogs = await publicClient.getLogs({
      address: contractAddress,
      event: {
        type: 'event',
        name: 'MarketCreated',
        inputs: [
          { name: 'marketId', type: 'uint256', indexed: true },
          { name: 'creator', type: 'address', indexed: true },
          { name: 'question', type: 'string', indexed: false },
          { name: 'description', type: 'string', indexed: false },
          { name: 'category', type: 'string', indexed: false },
          { name: 'imageUrl', type: 'string', indexed: false },
          { name: 'sourceLinks', type: 'string[]', indexed: false },
          { name: 'endTime', type: 'uint256', indexed: false },
          { name: 'status', type: 'uint8', indexed: false }
        ]
      },
      fromBlock: recentFromBlock,
      toBlock: recentToBlock
    });

    console.log(`📊 Found ${recentLogs.length} MarketCreated events in last 50 blocks`);

    if (recentLogs.length > 0) {
      console.log('\n🎉 Recent MarketCreated events:');
      recentLogs.forEach((log, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log('  Block:', log.blockNumber);
        console.log('  Transaction:', log.transactionHash);
        console.log('  Topics:', log.topics);
      });
    }

  } catch (error) {
    console.error('❌ Error debugging event details:', error);
  }
};

// Run the debug
debugEventDetails();
