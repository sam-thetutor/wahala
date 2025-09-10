#!/usr/bin/env node

/**
 * Deploy updated contracts using ethers directly
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Contract addresses
const CELO_RPC_URL = process.env.CELO_RPC_URL || 'https://forno.celo.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'e6c9282f0777361430384ac956bedca9d62e747de7be6a6988a475d2f09fa3b3';

// Read contract source files
function readContractSource(contractName) {
  const contractPath = path.join(__dirname, '..', 'contracts', `${contractName}.sol`);
  return fs.readFileSync(contractPath, 'utf8');
}

async function deployContract(provider, signer, contractName, constructorArgs = []) {
  try {
    console.log(`\n🚀 Deploying ${contractName}...`);
    
    const sourceCode = readContractSource(contractName);
    console.log(`📄 Source code loaded (${sourceCode.length} characters)`);
    
    // Create contract factory
    const factory = new ethers.ContractFactory(
      sourceCode,
      signer
    );
    
    console.log(`📝 Sending deployment transaction...`);
    const contract = await factory.deploy(...constructorArgs);
    console.log(`📝 Transaction hash: ${contract.deploymentTransaction().hash}`);
    
    console.log(`⏳ Waiting for deployment confirmation...`);
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log(`✅ ${contractName} deployed successfully!`);
    console.log(`📍 Address: ${address}`);
    
    return { contract, address };
  } catch (error) {
    console.error(`❌ Error deploying ${contractName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting contract deployment...\n');
  
  // Create provider and signer
  const provider = new ethers.JsonRpcProvider(CELO_RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`🔑 Using wallet: ${await signer.getAddress()}`);
  console.log(`🌐 Network: Celo Mainnet (${CELO_RPC_URL})`);
  
  try {
    // Deploy Claims contract first
    const claimsResult = await deployContract(provider, signer, 'PredictionMarketClaims');
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Deploy Core contract with Claims address
    const coreResult = await deployContract(provider, signer, 'PredictionMarketCore', [claimsResult.address]);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Deployment completed successfully!');
    console.log('='.repeat(60));
    console.log(`📋 Contract Addresses:`);
    console.log(`   Claims Contract: ${claimsResult.address}`);
    console.log(`   Core Contract: ${coreResult.address}`);
    
    // Save addresses to a file
    const addresses = {
      CELO: {
        PREDICTION_MARKET_CORE: coreResult.address,
        PREDICTION_MARKET_CLAIMS: claimsResult.address,
      },
      DEPLOYED_AT: new Date().toISOString(),
      DEPLOYER: await signer.getAddress(),
    };
    
    const addressesPath = path.join(__dirname, '..', 'deployments', 'addresses.json');
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log(`\n💾 Addresses saved to: ${addressesPath}`);
    
    console.log('\n✅ All contracts deployed successfully!');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
