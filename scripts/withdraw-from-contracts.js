#!/usr/bin/env node

/**
 * Script to withdraw CELO tokens from both current and old core contracts
 * 
 * Current Core Contract: 0x7176D16D61A122231a78749c61740ad8F86BB13a
 * Old Core Contract: 0x2D6614fe45da6Aa7e60077434129a51631AC702A
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
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkContractBalance(provider, contractAddress, contractName) {
  try {
    const contract = new ethers.Contract(contractAddress, CORE_CONTRACT_ABI, provider);
    
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.log(`❌ ${contractName} (${contractAddress}) - Contract not found or not deployed`);
      return { exists: false, balance: '0' };
    }
    
    // Get contract balance
    const balance = await provider.getBalance(contractAddress);
    const balanceInCELO = ethers.formatEther(balance);
    
    console.log(`📊 ${contractName} (${contractAddress})`);
    console.log(`   Balance: ${balanceInCELO} CELO`);
    console.log(`   Balance (wei): ${balance.toString()}`);
    
    return { exists: true, balance: balance.toString() };
  } catch (error) {
    console.error(`❌ Error checking ${contractName}:`, error.message);
    return { exists: false, balance: '0' };
  }
}

async function getContractOwner(provider, contractAddress, contractName) {
  try {
    const contract = new ethers.Contract(contractAddress, CORE_CONTRACT_ABI, provider);
    const owner = await contract.owner();
    console.log(`👤 ${contractName} Owner: ${owner}`);
    return owner;
  } catch (error) {
    console.error(`❌ Error getting owner for ${contractName}:`, error.message);
    return null;
  }
}

async function withdrawFromContract(signer, contractAddress, contractName) {
  try {
    const contract = new ethers.Contract(contractAddress, CORE_CONTRACT_ABI, signer);
    
    // Check if user is the owner
    const owner = await contract.owner();
    const signerAddress = await signer.getAddress();
    
    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      console.log(`❌ ${contractName} - You are not the owner. Owner: ${owner}`);
      return false;
    }
    
    // Check balance before withdrawal
    const balanceBefore = await contract.getContractBalance();
    const balanceBeforeCELO = ethers.formatEther(balanceBefore);
    
    if (balanceBefore === 0n) {
      console.log(`⚠️  ${contractName} - No balance to withdraw`);
      return false;
    }
    
    console.log(`💰 ${contractName} - Withdrawing ${balanceBeforeCELO} CELO...`);
    
    // Execute withdrawal
    const tx = await contract.withdrawFees();
    console.log(`📝 Transaction hash: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ ${contractName} - Withdrawal successful! Gas used: ${receipt.gasUsed.toString()}`);
    
    // Check balance after withdrawal
    const balanceAfter = await contract.getContractBalance();
    const balanceAfterCELO = ethers.formatEther(balanceAfter);
    console.log(`📊 ${contractName} - Balance after withdrawal: ${balanceAfterCELO} CELO`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error withdrawing from ${contractName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting contract withdrawal process...\n');
  
  // Check if private key is provided
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in environment variables');
    console.log('Please set PRIVATE_KEY in your .env file');
    process.exit(1);
  }
  
  // Create provider and signer
  const provider = new ethers.JsonRpcProvider(CELO_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`🔑 Using wallet: ${await signer.getAddress()}\n`);
  
  // Check balances first
  console.log('📊 Checking contract balances...\n');
  
  const currentContractInfo = await checkContractBalance(provider, CURRENT_CORE_CONTRACT, 'Current Core Contract');
  const oldContractInfo = await checkContractBalance(provider, OLD_CORE_CONTRACT, 'Old Core Contract');
  
  console.log('\n👤 Checking contract owners...\n');
  
  const currentOwner = await getContractOwner(provider, CURRENT_CORE_CONTRACT, 'Current Core Contract');
  const oldOwner = await getContractOwner(provider, OLD_CORE_CONTRACT, 'Old Core Contract');
  
  console.log('\n💰 Starting withdrawal process...\n');
  
  let totalWithdrawn = 0;
  
  // Withdraw from current contract
  if (currentContractInfo.exists && currentContractInfo.balance !== '0') {
    const success = await withdrawFromContract(signer, CURRENT_CORE_CONTRACT, 'Current Core Contract');
    if (success) {
      totalWithdrawn++;
    }
  } else {
    console.log('⚠️  Current Core Contract - No balance to withdraw or contract not found');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Withdraw from old contract
  if (oldContractInfo.exists && oldContractInfo.balance !== '0') {
    const success = await withdrawFromContract(signer, OLD_CORE_CONTRACT, 'Old Core Contract');
    if (success) {
      totalWithdrawn++;
    }
  } else {
    console.log('⚠️  Old Core Contract - No balance to withdraw or contract not found');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎉 Withdrawal process completed! Successfully withdrew from ${totalWithdrawn} contracts.`);
  
  if (totalWithdrawn === 0) {
    console.log('ℹ️  No contracts had withdrawable balances or you are not the owner.');
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
