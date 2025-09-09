// Script to decode the actual event
const { createPublicClient, http, decodeEventLog } = require('viem');
const { celo } = require('viem/chains');

const decodeEvent = async () => {
  console.log('🔍 Decoding the actual event...');

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
      console.log('  Data:', log.data);

      // Try to decode with different event signatures
      const possibleEvents = [
        {
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
        {
          name: 'SharesBought',
          inputs: [
            { name: 'marketId', type: 'uint256', indexed: true },
            { name: 'buyer', type: 'address', indexed: true },
            { name: 'side', type: 'bool', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
            { name: 'totalPool', type: 'uint256', indexed: false },
            { name: 'totalYes', type: 'uint256', indexed: false },
            { name: 'totalNo', type: 'uint256', indexed: false }
          ]
        },
        {
          name: 'MarketResolved',
          inputs: [
            { name: 'marketId', type: 'uint256', indexed: true },
            { name: 'outcome', type: 'bool', indexed: false }
          ]
        }
      ];

      console.log('\n🔍 Trying to decode with different event signatures...');
      
      for (const event of possibleEvents) {
        try {
          const decoded = decodeEventLog({
            abi: [event],
            data: log.data,
            topics: log.topics
          });
          
          console.log(`\n✅ Successfully decoded as ${event.name}:`);
          console.log('  Args:', decoded.args);
          
          if (event.name === 'MarketCreated') {
            console.log('  Market ID:', decoded.args.marketId);
            console.log('  Creator:', decoded.args.creator);
            console.log('  Question:', decoded.args.question);
            console.log('  Description:', decoded.args.description);
            console.log('  Category:', decoded.args.category);
            console.log('  End Time:', new Date(Number(decoded.args.endTime) * 1000).toLocaleString());
          }
          
        } catch (error) {
          console.log(`❌ Failed to decode as ${event.name}:`, error.message);
        }
      }

      // Let's also try to manually decode the data
      console.log('\n🔍 Manual data analysis:');
      console.log('  First topic (event signature):', log.topics[0]);
      console.log('  Second topic (marketId):', log.topics[1]);
      console.log('  Third topic (creator):', log.topics[2]);
      
      // Convert the second topic to number (marketId)
      const marketId = BigInt(log.topics[1]);
      console.log('  Market ID (decimal):', marketId.toString());
      
      // Convert the third topic to address (creator)
      const creator = '0x' + log.topics[2].slice(26);
      console.log('  Creator address:', creator);
      
      // Try to decode the data section
      console.log('\n🔍 Data section analysis:');
      console.log('  Data length:', log.data.length);
      console.log('  Data (first 200 chars):', log.data.slice(0, 200));
      
      // The data section contains the non-indexed parameters
      // Let's try to extract strings from it
      const dataHex = log.data.slice(2); // Remove 0x prefix
      console.log('  Data hex length:', dataHex.length);
    }

  } catch (error) {
    console.error('❌ Error decoding event:', error);
  }
};

// Run the decode
decodeEvent();
