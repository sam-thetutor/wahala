#!/usr/bin/env node

/**
 * Script to check CELO balances in both current and old core contracts
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

// Core contract ABI (minimal for checking)
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
    "name": "getContractBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkContractInfo(provider, contractAddress, contractName) {
  try {
    console.log(`\n📊 Checking ${contractName}...`);
    console.log(`   Address: ${contractAddress}`);
    
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.log(`   ❌ Contract not found or not deployed`);
      return { exists: false, balance: '0', owner: null };
    }
    
    const contract = new ethers.Contract(contractAddress, CORE_CONTRACT_ABI, provider);
    
    // Get contract balance
    const balance = await provider.getBalance(contractAddress);
    const balanceInCELO = ethers.formatEther(balance);
    
    // Get owner
    let owner = null;
    try {
      owner = await contract.owner();
      console.log(`   👤 Owner: ${owner}`);
    } catch (error) {
      console.log(`   ⚠️  Could not get owner: ${error.message}`);
    }
    
    console.log(`   💰 Balance: ${balanceInCELO} CELO`);
    console.log(`   💰 Balance (wei): ${balance.toString()}`);
    
    return { 
      exists: true, 
      balance: balance.toString(), 
      balanceCELO: balanceInCELO,
      owner 
    };
  } catch (error) {
    console.error(`   ❌ Error checking ${contractName}:`, error.message);
    return { exists: false, balance: '0', owner: null };
  }
}

async function main() {
  console.log('🔍 Checking contract balances and ownership...\n');
  
  // Create provider
  const provider = new ethers.JsonRpcProvider(CELO_RPC_URL);
  
  // Check current contract
  const currentInfo = await checkContractInfo(provider, CURRENT_CORE_CONTRACT, 'Current Core Contract');
  
  // Check old contract
  const oldInfo = await checkContractInfo(provider, OLD_CORE_CONTRACT, 'Old Core Contract');
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  
  if (currentInfo.exists) {
    console.log(`✅ Current Core Contract: ${currentInfo.balanceCELO} CELO`);
    if (currentInfo.owner) {
      console.log(`   Owner: ${currentInfo.owner}`);
    }
  } else {
    console.log(`❌ Current Core Contract: Not found or not deployed`);
  }
  
  if (oldInfo.exists) {
    console.log(`✅ Old Core Contract: ${oldInfo.balanceCELO} CELO`);
    if (oldInfo.owner) {
      console.log(`   Owner: ${oldInfo.owner}`);
    }
  } else {
    console.log(`❌ Old Core Contract: Not found or not deployed`);
  }
  
  // Check if you can withdraw
  if (process.env.PRIVATE_KEY) {
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const yourAddress = await signer.getAddress();
    console.log(`\n🔑 Your wallet: ${yourAddress}`);
    
    if (currentInfo.owner && currentInfo.owner.toLowerCase() === yourAddress.toLowerCase()) {
      console.log(`✅ You can withdraw from Current Core Contract`);
    } else if (currentInfo.exists) {
      console.log(`❌ You cannot withdraw from Current Core Contract (not owner)`);
    }
    
    if (oldInfo.owner && oldInfo.owner.toLowerCase() === yourAddress.toLowerCase()) {
      console.log(`✅ You can withdraw from Old Core Contract`);
    } else if (oldInfo.exists) {
      console.log(`❌ You cannot withdraw from Old Core Contract (not owner)`);
    }
  } else {
    console.log(`\n⚠️  No PRIVATE_KEY found - cannot check withdrawal permissions`);
  }
  
  console.log('\n💡 To withdraw, run: node scripts/withdraw-from-contracts.js');
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Balance check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
