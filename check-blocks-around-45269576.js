const { createPublicClient, http } = require('viem');
const { celo } = require('viem/chains');

async function checkBlocksAround45269576() {
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
  });

  try {
    console.log('Checking blocks around 45269576 for events...');
    console.log('Contract address: 0x8bac784d1c849541ccd82915025f5752af7ff029');
    
    // Check 5 blocks before and after
    const fromBlock = 45269571;
    const toBlock = 45269581;
    
    console.log(`Checking blocks ${fromBlock} to ${toBlock}`);
    
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
    
    console.log(`\nFound ${sharesBoughtLogs.length} SharesBought events in blocks ${fromBlock}-${toBlock}`);
    sharesBoughtLogs.forEach((log, i) => {
      console.log(`\nSharesBought ${i + 1}:`);
      console.log(`  Block: ${log.blockNumber}`);
      console.log(`  Transaction: ${log.transactionHash}`);
      console.log(`  Market ID: ${log.args.marketId?.toString()}`);
      console.log(`  Buyer: ${log.args.buyer}`);
      console.log(`  Side: ${log.args.side ? 'YES' : 'NO'}`);
      console.log(`  Amount: ${log.args.amount?.toString()}`);
    });
    
    // Check for any events from the contract
    const allLogs = await publicClient.getLogs({
      address: '0x8bac784d1c849541ccd82915025f5752af7ff029',
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock)
    });
    
    console.log(`\nTotal events from contract in blocks ${fromBlock}-${toBlock}: ${allLogs.length}`);
    allLogs.forEach((log, i) => {
      console.log(`\nEvent ${i + 1}:`);
      console.log(`  Block: ${log.blockNumber}`);
      console.log(`  Transaction: ${log.transactionHash}`);
      console.log(`  Topics: ${log.topics}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBlocksAround45269576();
