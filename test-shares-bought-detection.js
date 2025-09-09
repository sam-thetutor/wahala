// Test script to verify SharesBought event detection
const { createPublicClient, http, parseEventLogs } = require('viem');
const { celo } = require('viem/chains');
const { PREDICTION_MARKET_CORE_ABI } = require('./contracts/contracts.ts');

const testSharesBoughtDetection = async () => {
  console.log('🔍 Testing SharesBought event detection...');

  try {
    // Initialize client
    const publicClient = createPublicClient({
      chain: celo,
      transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
    });

    const contractAddress = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';
    
    // Check blocks around 45265073
    const targetBlock = 45265073n;
    const fromBlock = targetBlock - 5n;
    const toBlock = targetBlock + 5n;

    console.log(`🔍 Checking blocks ${fromBlock} to ${toBlock} for SharesBought events...`);

    // Get SharesBought events with the correct signature
    const sharesBoughtLogs = await publicClient.getLogs({
      address: contractAddress,
      event: {
        type: 'event',
        name: 'SharesBought',
        inputs: [
          { name: 'marketId', type: 'uint256', indexed: true },
          { name: 'buyer', type: 'address', indexed: true },
          { name: 'isYesShares', type: 'bool', indexed: false },
          { name: 'amount', type: 'uint256', indexed: false }
        ]
      },
      fromBlock,
      toBlock
    });

    console.log(`📊 Found ${sharesBoughtLogs.length} SharesBought events in range`);

    if (sharesBoughtLogs.length > 0) {
      console.log('🎉 SharesBought events found:');
      sharesBoughtLogs.forEach((log, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log('  Block:', log.blockNumber);
        console.log('  Transaction:', log.transactionHash);
        console.log('  Topics:', log.topics);
        console.log('  Data:', log.data);
      });

      // Try to parse the events
      try {
        const parsedLogs = parseEventLogs({
          abi: PREDICTION_MARKET_CORE_ABI,
          logs: sharesBoughtLogs,
          eventName: 'SharesBought'
        });

        console.log('\n📋 Parsed events:');
        parsedLogs.forEach((event, index) => {
          console.log(`\nParsed Event ${index + 1}:`);
          console.log('  Market ID:', event.args.marketId);
          console.log('  Buyer:', event.args.buyer);
          console.log('  Is Yes Shares:', event.args.isYesShares);
          console.log('  Amount:', event.args.amount);
        });
      } catch (parseError) {
        console.error('❌ Error parsing events:', parseError);
      }
    } else {
      console.log('❌ No SharesBought events found in the specified range');
      
      // Check a wider range
      console.log('\n🔍 Checking wider range (last 50 blocks)...');
      const currentBlock = await publicClient.getBlockNumber();
      const widerFromBlock = currentBlock - 50n;
      const widerToBlock = currentBlock;

      const widerLogs = await publicClient.getLogs({
        address: contractAddress,
        event: {
          type: 'event',
          name: 'SharesBought',
          inputs: [
            { name: 'marketId', type: 'uint256', indexed: true },
            { name: 'buyer', type: 'address', indexed: true },
            { name: 'isYesShares', type: 'bool', indexed: false },
            { name: 'amount', type: 'uint256', indexed: false }
          ]
        },
        fromBlock: widerFromBlock,
        toBlock: widerToBlock
      });

      console.log(`📊 Found ${widerLogs.length} SharesBought events in wider range`);
      
      if (widerLogs.length > 0) {
        console.log('🎉 Recent SharesBought events:');
        widerLogs.forEach((log, index) => {
          console.log(`\nEvent ${index + 1}:`);
          console.log('  Block:', log.blockNumber);
          console.log('  Transaction:', log.transactionHash);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error testing SharesBought detection:', error);
  }
};

// Run the test
testSharesBoughtDetection();
