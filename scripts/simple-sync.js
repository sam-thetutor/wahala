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

const CONTRACT_ADDRESS = '0x7176D16D61A122231a78749c61740ad8F86BB13a';

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
    return 'Unknown';
  }
}

async function simpleSync() {
  console.log('🚀 Starting simple blockchain sync...');
  
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
        
        // Decode the event data
        const data = log.data.slice(2);
        const question = decodeString(data.slice(0, 64));
        const description = decodeString(data.slice(64, 128));
        const creator = '0x' + log.topics[2].slice(26);
        const endTime = BigInt('0x' + data.slice(128, 192));
        
        console.log(`📊 Market data:`, {
          question,
          creator,
          endTime: endTime.toString()
        });
        
        // Update market via API
        const marketUpdateResponse = await fetch('http://localhost:3000/api/markets/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
        
        const yesShares = side ? amount.toString() : '0';
        const noShares = side ? '0' : amount.toString();
        
        console.log(`👤 Processing shares for market ${marketId}, buyer ${buyer}: ${side ? 'YES' : 'NO'} ${amount.toString()}`);
        
        // Update participant via API
        const participantUpdateResponse = await fetch('http://localhost:3000/api/markets/update-participant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            marketId: marketId.toString(),
            address: buyer,
            yesShares,
            noShares,
            totalInvestment: amount.toString(),
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
    
    console.log('\n🎉 Simple blockchain sync completed!');
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
  }
}

// Run the sync
simpleSync().then(() => {
  console.log('✅ Sync script finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Sync script failed:', error);
  process.exit(1);
});
