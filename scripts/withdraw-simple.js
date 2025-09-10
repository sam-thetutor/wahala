#!/usr/bin/env node

/**
 * Simple withdrawal script for core contracts
 * Run with: PRIVATE_KEY=your_key node scripts/withdraw-simple.js
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Contract addresses
const CURRENT_CORE_CONTRACT = '0x7176D16D61A122231a78749c61740ad8F86BB13a';
const OLD_CORE_CONTRACT = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';

// Celo RPC URL
const CELO_RPC_URL = process.env.CELO_RPC_URL || 'https://forno.celo.org';

// Core contract ABI (minimal for withdrawal)
const CORE_CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function withdrawFromContract(signer, contractAddress, contractName) {
  try {
    console.log(`\n💰 Withdrawing from ${contractName}...`);
    console.log(`   Address: ${contractAddress}`);
    
    const contract = new ethers.Contract(contractAddress, CORE_CONTRACT_ABI, signer);
    
    // Check balance before withdrawal
    const balanceBefore = await signer.provider.getBalance(contractAddress);
    const balanceBeforeCELO = ethers.formatEther(balanceBefore);
    
    if (balanceBefore === 0n) {
      console.log(`   ⚠️  No balance to withdraw`);
      return false;
    }
    
    console.log(`   💰 Balance: ${balanceBeforeCELO} CELO`);
    
    // Execute withdrawal
    console.log(`   📝 Sending withdrawal transaction...`);
    const tx = await contract.withdrawFees();
    console.log(`   📝 Transaction hash: ${tx.hash}`);
    
    // Wait for confirmation
    console.log(`   ⏳ Waiting for confirmation...`);
    const receipt = await tx.wait();
    console.log(`   ✅ Withdrawal successful!`);
    console.log(`   📊 Gas used: ${receipt.gasUsed.toString()}`);
    
    // Check balance after withdrawal
    const balanceAfter = await signer.provider.getBalance(contractAddress);
    const balanceAfterCELO = ethers.formatEther(balanceAfter);
    console.log(`   💰 Balance after: ${balanceAfterCELO} CELO`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting withdrawal process...\n');
  
  // Check if private key is provided
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ PRIVATE_KEY not found in environment variables');
    console.log('Please set PRIVATE_KEY in your .env file or run:');
    console.log('PRIVATE_KEY=your_private_key node scripts/withdraw-simple.js');
    process.exit(1);
  }
  
  // Create provider and signer
  const provider = new ethers.JsonRpcProvider(CELO_RPC_URL);
  const signer = new ethers.Wallet(privateKey, provider);
  
  console.log(`🔑 Using wallet: ${await signer.getAddress()}\n`);
  
  let totalWithdrawn = 0;
  
  // Withdraw from current contract
  const currentSuccess = await withdrawFromContract(signer, CURRENT_CORE_CONTRACT, 'Current Core Contract');
  if (currentSuccess) totalWithdrawn++;
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Withdraw from old contract
  const oldSuccess = await withdrawFromContract(signer, OLD_CORE_CONTRACT, 'Old Core Contract');
  if (oldSuccess) totalWithdrawn++;
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Withdrawal completed! Successfully withdrew from ${totalWithdrawn} contracts.`);
  
  if (totalWithdrawn === 0) {
    console.log('ℹ️  No contracts had withdrawable balances.');
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
