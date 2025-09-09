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

// Contract ABI for getMarket function
const PREDICTION_MARKET_CORE_ABI = [
  {
    "inputs": [{"name": "marketId", "type": "uint256"}],
    "name": "getMarket",
    "outputs": [
      {"name": "question", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "creator", "type": "address"},
      {"name": "endTime", "type": "uint256"},
      {"name": "totalPool", "type": "uint256"},
      {"name": "totalYes", "type": "uint256"},
      {"name": "totalNo", "type": "uint256"},
      {"name": "outcome", "type": "bool"},
      {"name": "resolved", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';

async function syncBlockchainToDatabase() {
  console.log('🚀 Starting blockchain to database sync...');
  
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
    
    // Show all unique event signatures
    const uniqueSignatures = [...new Set(allLogs.map(log => log.topics[0]))];
    console.log(`🔍 Unique event signatures found:`, uniqueSignatures);
    
    // Filter for MarketCreated events by signature
    const marketCreatedEvents = allLogs.filter(log => 
      log.topics[0] === '0xb4183b8de7dbacf7825f7d91d2d851d1fda6ca8bef3af33e97052daa1f4988ba'
    );
    
    console.log(`📊 Found ${marketCreatedEvents.length} MarketCreated events`);
    
    // Process each market
    for (const log of marketCreatedEvents) {
      let marketId;
      try {
        marketId = BigInt(log.topics[1]);
        console.log(`\n🔄 Processing market ${marketId}...`);
        
        // Get market data from blockchain
        const marketData = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: PREDICTION_MARKET_CORE_ABI,
          functionName: 'getMarket',
          args: [marketId]
        });
        
        console.log(`📊 Market data:`, {
          question: marketData.question,
          creator: marketData.creator,
          totalPool: marketData.totalPool.toString(),
          totalYes: marketData.totalYes.toString(),
          totalNo: marketData.totalNo.toString()
        });
        
        // Update market via API
        const marketUpdateResponse = await fetch('http://localhost:3000/api/markets/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: marketId.toString(),
            question: marketData.question,
            description: marketData.description,
            creator: marketData.creator,
            endtime: marketData.endTime.toString(),
            totalpool: marketData.totalPool.toString(),
            totalyes: marketData.totalYes.toString(),
            totalno: marketData.totalNo.toString(),
            status: marketData.resolved ? 1 : 0,
            outcome: marketData.outcome,
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
        
        // Get all SharesBought events for this market
        const sharesBoughtLogs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock: BigInt(startBlock),
          toBlock: currentBlock
        });
        
        const sharesBoughtEvents = sharesBoughtLogs.filter(log => 
          log.topics[0] === '0x3b8280c0b373e7d170b71b3cf420502d1edb6340a000ece87a2594c3db2ace80' &&
          log.topics[1] === log.topics[1] // Same market ID
        );
        
        console.log(`💰 Found ${sharesBoughtEvents.length} SharesBought events for market ${marketId}`);
        
        // Process each shares bought event
        for (const sharesLog of sharesBoughtEvents) {
          try {
            const buyer = '0x' + sharesLog.topics[2].slice(26);
            const data = sharesLog.data.slice(2);
            const side = data.slice(0, 64) === '0000000000000000000000000000000000000000000000000000000000000001';
            const amount = BigInt('0x' + data.slice(64, 128));
            
            const yesShares = side ? amount.toString() : '0';
            const noShares = side ? '0' : amount.toString();
            
            console.log(`👤 Processing shares for ${buyer}: ${side ? 'YES' : 'NO'} ${amount.toString()}`);
            
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
                transactionHash: sharesLog.transactionHash
              })
            });
            
            if (participantUpdateResponse.ok) {
              console.log(`✅ Participant shares updated for ${buyer}`);
            } else {
              console.error(`❌ Failed to update participant ${buyer}:`, await participantUpdateResponse.text());
            }
            
          } catch (error) {
            console.error(`❌ Error processing shares for market ${marketId}:`, error);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing market ${marketId}:`, error);
      }
    }
    
    console.log('\n🎉 Blockchain to database sync completed!');
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
  }
}

// Run the sync
syncBlockchainToDatabase().then(() => {
  console.log('✅ Sync script finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Sync script failed:', error);
  process.exit(1);
});