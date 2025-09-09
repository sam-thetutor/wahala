// Test script using the correct ABI to decode the event
const { createPublicClient, http, parseEventLogs } = require('viem');
const { celo } = require('viem/chains');

// Import the correct ABI
const { PREDICTION_MARKET_CORE_ABI } = require('./contracts/contracts.ts');

const testCorrectABI = async () => {
  console.log('🔍 Testing with correct ABI...');

  try {
    // Initialize client
    const publicClient = createPublicClient({
      chain: celo,
      transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
    });

    const contractAddress = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';
    
    // Get the specific log
    const logs = await publicClient.getLogs({
      address: contractAddress,
      fromBlock: 45264666n,
      toBlock: 45264666n
    });

    console.log(`📊 Found ${logs.length} events in block 45264666`);

    if (logs.length > 0) {
      const log = logs[0];
      console.log('\n📋 Raw event data:');
      console.log('  Block:', log.blockNumber);
      console.log('  Transaction:', log.transactionHash);
      console.log('  Topics:', log.topics);
      console.log('  Data length:', log.data.length);

      // Try to decode with the correct ABI
      console.log('\n🔍 Trying to decode with correct ABI...');
      
      try {
        const parsedLogs = parseEventLogs({
          abi: PREDICTION_MARKET_CORE_ABI,
          logs: [log],
          eventName: 'MarketCreated'
        });

        console.log(`✅ Successfully parsed ${parsedLogs.length} events`);
        
        if (parsedLogs.length > 0) {
          const event = parsedLogs[0];
          console.log('\n🎉 Decoded MarketCreated event:');
          console.log('  Market ID:', event.args.marketId);
          console.log('  Creator:', event.args.creator);
          console.log('  Question:', event.args.question);
          console.log('  Description:', event.args.description);
          console.log('  Source:', event.args.source);
          console.log('  End Time:', new Date(Number(event.args.endTime) * 1000).toLocaleString());
          console.log('  Creation Fee:', event.args.creationFee);
        }
        
      } catch (error) {
        console.error('❌ Error parsing with correct ABI:', error.message);
        
        // Try to decode with all possible events
        console.log('\n🔍 Trying to decode with all events...');
        
        const allEvents = ['MarketCreated', 'SharesBought', 'MarketResolved', 'UsernameSet', 'UsernameChanged', 'OwnershipTransferred', 'ClaimsContractSet'];
        
        for (const eventName of allEvents) {
          try {
            const parsedLogs = parseEventLogs({
              abi: PREDICTION_MARKET_CORE_ABI,
              logs: [log],
              eventName: eventName
            });
            
            if (parsedLogs.length > 0) {
              console.log(`✅ Successfully parsed as ${eventName}:`, parsedLogs[0].args);
            }
          } catch (e) {
            // Ignore errors for events that don't match
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error testing with correct ABI:', error);
  }
};

// Run the test
testCorrectABI();
