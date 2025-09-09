#!/usr/bin/env node

/**
 * Deployment script for Prediction Market contracts on Celo Mainnet using Foundry
 * 
 * This script uses Foundry to compile and deploy:
 * 1. PredictionMarketCore contract
 * 2. PredictionMarketClaims contract (with reference to Core)
 * 
 * Prerequisites:
 * - Install Foundry: curl -L https://foundry.paradigm.xyz | bash && foundryup
 * - Run: forge install
 * 
 * Usage: node scripts/deploy-celo-foundry.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PRIVATE_KEY = 'de02aea8dabb0cb2a0830ffb299f82fcdd8cf14d08563f2dfeaf378110a10f61';
const CELO_RPC_URL = 'https://forno.celo.org';
const DEPLOYER_ADDRESS = '0x21D654daaB0fe1be0e584980ca7C1a382850939f'; // This should match the private key

async function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  try {
    // Check if Foundry is installed
    execSync('forge --version', { stdio: 'pipe' });
    console.log('✅ Foundry is installed');
  } catch (error) {
    throw new Error('Foundry is not installed. Please install it first: curl -L https://foundry.paradigm.xyz | bash && foundryup');
  }

  try {
    // Check if contracts exist
    const coreContractPath = path.join(__dirname, '..', 'contracts', 'PredictionMarketCore.sol');
    const claimsContractPath = path.join(__dirname, '..', 'contracts', 'PredictionMarketClaims.sol');
    
    if (!fs.existsSync(coreContractPath)) {
      throw new Error('PredictionMarketCore.sol not found');
    }
    if (!fs.existsSync(claimsContractPath)) {
      throw new Error('PredictionMarketClaims.sol not found');
    }
    
    console.log('✅ Contract files found');
  } catch (error) {
    throw new Error(`Contract files missing: ${error.message}`);
  }
}

async function compileContracts() {
  console.log('\n📦 Compiling contracts...');
  
  // Create foundry.toml if it doesn't exist
  const foundryConfig = `[profile.default]
src = "contracts"
out = "out"
libs = ["lib"]
solc = "0.8.19"
optimizer = true
optimizer_runs = 200
via_ir = false

[rpc_endpoints]
celo = "${CELO_RPC_URL}"

[etherscan]
celo = { key = "", url = "https://api.celoscan.io/api" }`;

  const foundryConfigPath = path.join(__dirname, '..', 'foundry.toml');
  if (!fs.existsSync(foundryConfigPath)) {
    fs.writeFileSync(foundryConfigPath, foundryConfig);
    console.log('📝 Created foundry.toml');
  }

  // Compile contracts
  await runCommand('forge build', 'Compiling contracts with Foundry');
}

async function deployContracts() {
  console.log('\n🚀 Deploying contracts to Celo Mainnet...');
  
  // Set up environment
  process.env.PRIVATE_KEY = PRIVATE_KEY;
  process.env.CELO_RPC_URL = CELO_RPC_URL;

  // Deploy PredictionMarketCore
  console.log('\n📦 Deploying PredictionMarketCore...');
  const coreDeployCommand = `forge create --rpc-url ${CELO_RPC_URL} --private-key ${PRIVATE_KEY} --verify --etherscan-api-key "" contracts/PredictionMarketCore.sol:PredictionMarketCore`;
  
  const coreOutput = await runCommand(coreDeployCommand, 'Deploying PredictionMarketCore');
  
  // Extract contract address from output
  const coreAddressMatch = coreOutput.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
  if (!coreAddressMatch) {
    throw new Error('Failed to extract core contract address from deployment output');
  }
  const coreContractAddress = coreAddressMatch[1];
  console.log(`✅ PredictionMarketCore deployed at: ${coreContractAddress}`);

  // Deploy PredictionMarketClaims with Core contract address
  console.log('\n📦 Deploying PredictionMarketClaims...');
  const claimsDeployCommand = `forge create --rpc-url ${CELO_RPC_URL} --private-key ${PRIVATE_KEY} --verify --etherscan-api-key "" --constructor-args ${coreContractAddress} contracts/PredictionMarketClaims.sol:PredictionMarketClaims`;
  
  const claimsOutput = await runCommand(claimsDeployCommand, 'Deploying PredictionMarketClaims');
  
  // Extract contract address from output
  const claimsAddressMatch = claimsOutput.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
  if (!claimsAddressMatch) {
    throw new Error('Failed to extract claims contract address from deployment output');
  }
  const claimsContractAddress = claimsAddressMatch[1];
  console.log(`✅ PredictionMarketClaims deployed at: ${claimsContractAddress}`);

  return { coreContractAddress, claimsContractAddress };
}

async function verifyContracts(coreAddress, claimsAddress) {
  console.log('\n🔍 Verifying contracts...');
  
  try {
    // Basic verification by calling a view function
    const verifyCommand = `cast call ${coreAddress} "getMarketCount()" --rpc-url ${CELO_RPC_URL}`;
    const result = await runCommand(verifyCommand, 'Verifying core contract');
    console.log(`✅ Core contract verified - Market count: ${result.trim()}`);
  } catch (error) {
    console.warn(`⚠️  Contract verification failed: ${error.message}`);
  }
}

async function saveDeploymentInfo(coreAddress, claimsAddress) {
  console.log('\n💾 Saving deployment information...');
  
  const deploymentInfo = {
    network: 'celo-mainnet',
    chainId: 42220,
    deployedAt: new Date().toISOString(),
    deployer: DEPLOYER_ADDRESS,
    contracts: {
      PredictionMarketCore: {
        address: coreAddress,
        transactionHash: 'See foundry output above'
      },
      PredictionMarketClaims: {
        address: claimsAddress,
        transactionHash: 'See foundry output above'
      }
    },
    rpcUrl: CELO_RPC_URL
  };

  // Save to deployments directory
  const deploymentFile = path.join(__dirname, '..', 'deployments', 'celo-mainnet.json');
  const deploymentsDir = path.dirname(deploymentFile);
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Deployment info saved to: ${deploymentFile}`);

  // Generate environment variables
  const envContent = `# Celo Mainnet Contract Addresses - Generated ${new Date().toISOString()}
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=${coreAddress}
NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=${claimsAddress}

# Previous addresses (for reference)
# NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO_OLD=0x2D6614fe45da6Aa7e60077434129a51631AC702A
# NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO_OLD=0x...`;

  const envFile = path.join(__dirname, '..', '.env.local.celo');
  fs.writeFileSync(envFile, envContent);
  console.log(`📝 Environment variables saved to: ${envFile}`);
}

async function main() {
  try {
    console.log('🚀 Starting Celo Mainnet deployment with Foundry...\n');
    
    // Check prerequisites
    await checkPrerequisites();
    
    // Compile contracts
    await compileContracts();
    
    // Deploy contracts
    const { coreContractAddress, claimsContractAddress } = await deployContracts();
    
    // Verify contracts
    await verifyContracts(coreContractAddress, claimsContractAddress);
    
    // Save deployment info
    await saveDeploymentInfo(coreContractAddress, claimsContractAddress);
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Core Contract: ${coreContractAddress}`);
    console.log(`   Claims Contract: ${claimsContractAddress}`);
    console.log(`   Network: Celo Mainnet (42220)`);
    console.log(`   Deployer: ${DEPLOYER_ADDRESS}`);
    
    console.log('\n📝 Next steps:');
    console.log('   1. Copy the new addresses to your .env.local file');
    console.log('   2. Update the frontend configuration files');
    console.log('   3. Test the contracts with a small transaction');
    console.log('   4. Verify contracts on Celo Explorer if needed');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment
main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
