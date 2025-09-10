#!/usr/bin/env node

/**
 * Quick deployment script for Celo Mainnet
 * 
 * This script provides a simple interface to deploy contracts and update the frontend.
 * 
 * Usage: 
 *   node scripts/quick-deploy.js deploy
 *   node scripts/quick-deploy.js update <core-address> <claims-address>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CELO_RPC_URL = 'https://forno.celo.org';

function showUsage() {
  console.log('🚀 Quick Deployment Script for Celo Mainnet');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/quick-deploy.js deploy                    # Deploy new contracts');
  console.log('  node scripts/quick-deploy.js update <core> <claims>    # Update with existing addresses');
  console.log('  node scripts/quick-deploy.js help                      # Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/quick-deploy.js deploy');
  console.log('  node scripts/quick-deploy.js update 0x1234... 0x5678...');
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check if Foundry is installed
  try {
    execSync('forge --version', { stdio: 'pipe' });
    console.log('✅ Foundry is installed');
  } catch (error) {
    console.log('❌ Foundry is not installed. Installing...');
    try {
      execSync('curl -L https://foundry.paradigm.xyz | bash', { stdio: 'inherit' });
      execSync('foundryup', { stdio: 'inherit' });
      console.log('✅ Foundry installed successfully');
    } catch (installError) {
      console.error('❌ Failed to install Foundry. Please install manually:');
      console.error('   curl -L https://foundry.paradigm.xyz | bash');
      console.error('   foundryup');
      process.exit(1);
    }
  }
  
  // Check if contracts exist
  const coreContract = path.join(__dirname, '..', 'contracts', 'PredictionMarketCore.sol');
  const claimsContract = path.join(__dirname, '..', 'contracts', 'PredictionMarketClaims.sol');
  
  if (!fs.existsSync(coreContract)) {
    console.error('❌ PredictionMarketCore.sol not found');
    process.exit(1);
  }
  if (!fs.existsSync(claimsContract)) {
    console.error('❌ PredictionMarketClaims.sol not found');
    process.exit(1);
  }
  
  console.log('✅ Contract files found');
}

async function deployContracts() {
  console.log('\n🚀 Deploying contracts to Celo Mainnet...');
  
  try {
    // Compile contracts
    console.log('📦 Compiling contracts...');
    execSync('forge build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Contracts compiled');
    
    // Deploy PredictionMarketCore
    console.log('\n📦 Deploying PredictionMarketCore...');
    const coreDeployCmd = `forge create --rpc-url ${CELO_RPC_URL} --private-key ${PRIVATE_KEY} --verify --etherscan-api-key "" contracts/PredictionMarketCore.sol:PredictionMarketCore`;
    
    const coreOutput = execSync(coreDeployCmd, { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    
    // Extract core contract address
    const coreAddressMatch = coreOutput.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
    if (!coreAddressMatch) {
      throw new Error('Failed to extract core contract address');
    }
    const coreAddress = coreAddressMatch[1];
    console.log(`✅ PredictionMarketCore deployed at: ${coreAddress}`);
    
    // Deploy PredictionMarketClaims
    console.log('\n📦 Deploying PredictionMarketClaims...');
    const claimsDeployCmd = `forge create --rpc-url ${CELO_RPC_URL} --private-key ${PRIVATE_KEY} --verify --etherscan-api-key "" --constructor-args ${coreAddress} contracts/PredictionMarketClaims.sol:PredictionMarketClaims`;
    
    const claimsOutput = execSync(claimsDeployCmd, { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    
    // Extract claims contract address
    const claimsAddressMatch = claimsOutput.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
    if (!claimsAddressMatch) {
      throw new Error('Failed to extract claims contract address');
    }
    const claimsAddress = claimsAddressMatch[1];
    console.log(`✅ PredictionMarketClaims deployed at: ${claimsAddress}`);
    
    // Set claims contract reference
    console.log('\n🔗 Setting claims contract reference...');
    const setClaimsCmd = `cast send ${coreAddress} "setClaimsContract(address)" ${claimsAddress} --rpc-url ${CELO_RPC_URL} --private-key ${PRIVATE_KEY}`;
    execSync(setClaimsCmd, { stdio: 'inherit' });
    console.log('✅ Claims contract reference set');
    
    // Update frontend
    await updateFrontend(coreAddress, claimsAddress);
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log(`\n📋 Contract Addresses:`);
    console.log(`   Core: ${coreAddress}`);
    console.log(`   Claims: ${claimsAddress}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

async function updateFrontend(coreAddress, claimsAddress) {
  console.log('\n🔧 Updating frontend configuration...');
  
  // Update .env.local
  const envContent = `# Celo Mainnet Contract Addresses - Generated ${new Date().toISOString()}
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=${coreAddress}
NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=${claimsAddress}

# Previous addresses (for reference)
# NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO_OLD=0x2D6614fe45da6Aa7e60077434129a51631AC702A
# NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO_OLD=0x...`;

  const envFile = path.join(__dirname, '..', '.env.local');
  fs.writeFileSync(envFile, envContent);
  console.log('✅ Updated .env.local');
  
  // Update hook files
  const hooksToUpdate = [
    'hooks/usePredictionMarket.ts',
    'hooks/useMarkets.ts',
    'hooks/useMarketTrading.ts'
  ];
  
  for (const hookPath of hooksToUpdate) {
    const fullPath = path.join(__dirname, '..', hookPath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Update core contract address
      content = content.replace(
        /NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO.*?0x[a-fA-F0-9]{40}/g,
        `NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO || '${coreAddress}'`
      );
      
      // Update claims contract address
      content = content.replace(
        /NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO.*?0x[a-fA-F0-9]{40}/g,
        `NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO || '${claimsAddress}'`
      );
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated ${hookPath}`);
    }
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: 'celo-mainnet',
    chainId: 42220,
    deployedAt: new Date().toISOString(),
    deployer: '0x21D654daaB0fe1be0e584980ca7C1a382850939f',
    contracts: {
      PredictionMarketCore: {
        address: coreAddress
      },
      PredictionMarketClaims: {
        address: claimsAddress
      }
    }
  };
  
  const deploymentFile = path.join(__dirname, '..', 'deployments', 'celo-mainnet.json');
  const deploymentsDir = path.dirname(deploymentFile);
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log('✅ Deployment info saved');
}

async function updateWithAddresses(coreAddress, claimsAddress) {
  console.log(`\n🔧 Updating frontend with provided addresses...`);
  console.log(`   Core: ${coreAddress}`);
  console.log(`   Claims: ${claimsAddress}`);
  
  await updateFrontend(coreAddress, claimsAddress);
  
  console.log('\n✅ Frontend updated successfully!');
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'deploy':
      await checkPrerequisites();
      await deployContracts();
      break;
      
    case 'update':
      const coreAddress = process.argv[3];
      const claimsAddress = process.argv[4];
      
      if (!coreAddress || !claimsAddress) {
        console.error('❌ Please provide both core and claims addresses');
        console.error('   Usage: node scripts/quick-deploy.js update <core-address> <claims-address>');
        process.exit(1);
      }
      
      await updateWithAddresses(coreAddress, claimsAddress);
      break;
      
    case 'help':
    default:
      showUsage();
      break;
  }
}

main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
