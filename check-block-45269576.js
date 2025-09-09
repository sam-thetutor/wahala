const { createPublicClient, http } = require('viem');
const { celo } = require('viem/chains');

async function checkBlock45269576() {
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'),
  });

  try {
    console.log('Checking block 45269576 for events...');
    console.log('Contract address: 0x8bac784d1c849541ccd82915025f5752af7ff029');
    
    // Check for SharesBought events in that specific block
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
      fromBlock: BigInt(45269576),
      toBlock: BigInt(45269576)
    });
    
    console.log(`\nFound ${sharesBoughtLogs.length} SharesBought events in block 45269576`);
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
    
    // Also check for any events from the contract in that block
    const allLogs = await publicClient.getLogs({
      address: '0x8bac784d1c849541ccd82915025f5752af7ff029',
      fromBlock: BigInt(45269576),
      toBlock: BigInt(45269576)
    });
    
    console.log(`\nTotal events from contract in block 45269576: ${allLogs.length}`);
    allLogs.forEach((log, i) => {
      console.log(`\nEvent ${i + 1}:`);
      console.log(`  Block: ${log.blockNumber}`);
      console.log(`  Transaction: ${log.transactionHash}`);
      console.log(`  Topics: ${log.topics}`);
      console.log(`  Data: ${log.data}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBlock45269576();
