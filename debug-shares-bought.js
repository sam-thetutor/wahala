// Debug script to check SharesBought event signature
const { createPublicClient, http, parseEventLogs } = require('viem');
const { celo } = require('viem/chains');
const { PREDICTION_MARKET_CORE_ABI } = require('./contracts/contracts.ts');

const debugSharesBought = async () => {
  console.log('🔍 Debugging SharesBought event detection...');

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

    // Get all events from this contract in the range
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
        console.log('  Data length:', log.data.length);
      });

      // Try to decode each event with the correct ABI
      console.log('\n🔍 Trying to decode events with correct ABI...');
      
      for (let i = 0; i < allLogs.length; i++) {
        const log = allLogs[i];
        console.log(`\n--- Event ${i + 1} ---`);
        
        // Try all possible event types
        const eventTypes = ['SharesBought', 'MarketCreated', 'MarketResolved', 'UsernameSet', 'UsernameChanged'];
        
        for (const eventName of eventTypes) {
          try {
            const parsedLogs = parseEventLogs({
              abi: PREDICTION_MARKET_CORE_ABI,
              logs: [log],
              eventName: eventName
            });
            
            if (parsedLogs.length > 0) {
              console.log(`✅ Successfully parsed as ${eventName}:`);
              console.log('  Args:', parsedLogs[0].args);
              
              if (eventName === 'SharesBought') {
                console.log('  Market ID:', parsedLogs[0].args.marketId);
                console.log('  Buyer:', parsedLogs[0].args.buyer);
                console.log('  Is Yes Shares:', parsedLogs[0].args.isYesShares);
                console.log('  Amount:', parsedLogs[0].args.amount);
              }
            }
          } catch (e) {
            // Ignore errors for events that don't match
          }
        }
      }
    } else {
      console.log('❌ No events found in the specified range');
      
      // Check a wider range
      console.log('\n🔍 Checking wider range (last 20 blocks)...');
      const currentBlock = await publicClient.getBlockNumber();
      const widerFromBlock = currentBlock - 20n;
      const widerToBlock = currentBlock;

      const widerLogs = await publicClient.getLogs({
        address: contractAddress,
        fromBlock: widerFromBlock,
        toBlock: widerToBlock
      });

      console.log(`📊 Found ${widerLogs.length} events in wider range`);
      
      if (widerLogs.length > 0) {
        console.log('📋 Recent events:');
        widerLogs.forEach((log, index) => {
          console.log(`\nEvent ${index + 1}:`);
          console.log('  Block:', log.blockNumber);
          console.log('  Transaction:', log.transactionHash);
          console.log('  Topics:', log.topics);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error debugging SharesBought events:', error);
  }
};

// Run the debug
debugSharesBought();
