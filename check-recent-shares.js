const { createPublicClient, http } = require('viem');
const { celo } = require('viem/chains');

async function checkRecentShares() {
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
  });

  try {
    // Get current block
    const currentBlock = await publicClient.getBlockNumber();
    console.log('Current block:', Number(currentBlock));
    
    // Check last 100 blocks for SharesBought events
    const fromBlock = Number(currentBlock) - 100;
    const toBlock = Number(currentBlock);
    
    console.log(`Checking blocks ${fromBlock} to ${toBlock} for SharesBought events`);
    console.log('Contract address: 0x8bac784d1c849541ccd82915025f5752af7ff029');
    
    // Check for SharesBought events
    const sharesBoughtLogs = await publicClient.getLogs({
      address: '0x8bac784d1c849541ccd82915025f5752af7ff029',
      event: {
        type: 'event',
        name: 'SharesBought',
        inputs: [
          { name: 'marketId', type: 'uint256', indexed: true },
          { name: 'buyer', type: 'address', indexed: true },
          { name: 'side', type: 'bool', indexed: false },
          { name: 'amount', type: 'uint256', indexed: false },
          { name: 'totalPool', type: 'uint256', indexed: false },
          { name: 'totalYes', type: 'uint256', indexed: false },
          { name: 'totalNo', type: 'uint256', indexed: false }
        ]
      },
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock)
    });
    
    console.log(`\nFound ${sharesBoughtLogs.length} SharesBought events`);
    sharesBoughtLogs.forEach((log, i) => {
      console.log(`\nSharesBought ${i + 1}:`);
      console.log(`  Block: ${log.blockNumber}`);
      console.log(`  Transaction: ${log.transactionHash}`);
      console.log(`  Market ID: ${log.args.marketId?.toString()}`);
      console.log(`  Buyer: ${log.args.buyer}`);
      console.log(`  Side: ${log.args.side ? 'YES' : 'NO'}`);
      console.log(`  Amount: ${log.args.amount?.toString()}`);
      console.log(`  Total Pool: ${log.args.totalPool?.toString()}`);
      console.log(`  Total Yes: ${log.args.totalYes?.toString()}`);
      console.log(`  Total No: ${log.args.totalNo?.toString()}`);
    });
    
    // Also check for MarketCreated events
    const marketCreatedLogs = await publicClient.getLogs({
      address: '0x8bac784d1c849541ccd82915025f5752af7ff029',
      event: {
        type: 'event',
        name: 'MarketCreated',
        inputs: [
          { name: 'marketId', type: 'uint256', indexed: true },
          { name: 'creator', type: 'address', indexed: true },
          { name: 'question', type: 'string', indexed: false },
          { name: 'endTime', type: 'uint256', indexed: false },
          { name: 'category', type: 'string', indexed: false }
        ]
      },
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock)
    });
    
    console.log(`\nFound ${marketCreatedLogs.length} MarketCreated events`);
    marketCreatedLogs.forEach((log, i) => {
      console.log(`\nMarketCreated ${i + 1}:`);
      console.log(`  Block: ${log.blockNumber}`);
      console.log(`  Transaction: ${log.transactionHash}`);
      console.log(`  Market ID: ${log.args.marketId?.toString()}`);
      console.log(`  Creator: ${log.args.creator}`);
      console.log(`  Question: ${log.args.question}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRecentShares();
