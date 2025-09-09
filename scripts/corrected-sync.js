const { createPublicClient, http } = require('viem');
const { celo } = require('viem/chains');

// Initialize the public client
const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org', {
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000
  })
});

const CONTRACT_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';

// Helper function to decode string from hex
function decodeString(hex) {
  try {
    // Remove 0x prefix and convert to buffer
    const buffer = Buffer.from(hex.slice(2), 'hex');
    // Find the length (first 32 bytes)
    const length = parseInt(hex.slice(2, 66), 16);
    // Extract the string data (skip the length prefix)
    const stringData = buffer.slice(32, 32 + length);
    return stringData.toString('utf8');
  } catch (error) {
    console.log('Error decoding string:', error);
    return 'Unknown Market';
  }
}

async function correctedSync() {
  console.log('🚀 Starting corrected blockchain sync...');
  
  try {
    // Get current block number
    const currentBlock = await publicClient.getBlockNumber();
    console.log(`📊 Current block: ${currentBlock}`);
    
    // Start from the contract deployment block
    const startBlock = 44953084;
    console.log(`🔍 Scanning from block ${startBlock} to ${currentBlock}`);
    
    // Get all logs from the contract
    const allLogs = await publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      fromBlock: BigInt(startBlock),
      toBlock: currentBlock
    });
    
    console.log(`📊 Found ${allLogs.length} total logs from contract`);
    
    // Filter for MarketCreated events by signature
    const marketCreatedEvents = allLogs.filter(log => 
      log.topics[0] === '0xb4183b8de7dbacf7825f7d91d2d851d1fda6ca8bef3af33e97052daa1f4988ba'
    );
    
    console.log(`📊 Found ${marketCreatedEvents.length} MarketCreated events`);
    
    // Process each market event
    for (const log of marketCreatedEvents) {
      try {
        const marketId = BigInt(log.topics[1]);
        console.log(`\n🔄 Processing market ${marketId}...`);
        
        // Decode the event data - the data structure might be different
        const data = log.data.slice(2);
        
        // Try to decode the question and description from the data
        let question = 'Unknown Market';
        let description = 'No description available';
        
        try {
          // The data might contain encoded strings, let's try to decode them
          if (data.length >= 128) {
            // Try to decode the first string (question)
            const questionHex = data.slice(0, 64);
            question = decodeString(questionHex);
            
            // Try to decode the second string (description)  
            const descriptionHex = data.slice(64, 128);
            description = decodeString(descriptionHex);
          }
        } catch (error) {
          console.log('Error decoding strings, using defaults');
        }
        
        const creator = '0x' + log.topics[2].slice(26);
        const endTime = BigInt('0x' + data.slice(128, 192));
        
        console.log(`📊 Market data:`, {
          question,
          creator,
          endTime: endTime.toString()
        });
        
        // Update market via API with correct format
        const marketUpdateResponse = await fetch('http://localhost:3000/api/markets/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            marketId: marketId.toString(),
            type: 'create',
            data: {
              id: marketId.toString(),
              question: question,
              description: description,
              creator: creator,
              endtime: endTime.toString(),
              totalpool: '0',
              totalyes: '0',
              totalno: '0',
              status: 0,
              outcome: false,
              createdat: new Date().toISOString(),
              category: 'General',
              image: '',
              source: 'Blockchain Sync'
            }
          })
        });
        
        if (marketUpdateResponse.ok) {
          console.log(`✅ Market ${marketId} synced to database`);
        } else {
          console.error(`❌ Failed to sync market ${marketId}:`, await marketUpdateResponse.text());
        }
        
      } catch (error) {
        console.error(`❌ Error processing market:`, error);
      }
    }
    
    // Now process SharesBought events
    const sharesBoughtEvents = allLogs.filter(log => 
      log.topics[0] === '0x3b8280c0b373e7d170b71b3cf420502d1edb6340a000ece87a2594c3db2ace80'
    );
    
    console.log(`\n💰 Found ${sharesBoughtEvents.length} SharesBought events`);
    
    for (const log of sharesBoughtEvents) {
      try {
        const marketId = BigInt(log.topics[1]);
        const buyer = '0x' + log.topics[2].slice(26);
        const data = log.data.slice(2);
        const side = data.slice(0, 64) === '0000000000000000000000000000000000000000000000000000000000000001';
        const amount = BigInt('0x' + data.slice(64, 128));
        
        // Convert amount from wei to ether for the API
        const amountInEther = (Number(amount) / 1e18).toString();
        
        console.log(`👤 Processing shares for market ${marketId}, buyer ${buyer}: ${side ? 'YES' : 'NO'} ${amountInEther} ETH`);
        
        // Update participant via API with correct format
        const participantUpdateResponse = await fetch('http://localhost:3000/api/markets/update-participant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            marketId: marketId.toString(),
            address: buyer,
            outcome: side, // true for YES, false for NO
            amount: amountInEther,
            transactionHash: log.transactionHash
          })
        });
        
        if (participantUpdateResponse.ok) {
          console.log(`✅ Participant shares updated for ${buyer}`);
        } else {
          console.error(`❌ Failed to update participant ${buyer}:`, await participantUpdateResponse.text());
        }
        
      } catch (error) {
        console.error(`❌ Error processing shares:`, error);
      }
    }
    
    console.log('\n🎉 Corrected blockchain sync completed!');
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
  }
}

// Run the sync
correctedSync().then(() => {
  console.log('✅ Sync script finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Sync script failed:', error);
  process.exit(1);
});
