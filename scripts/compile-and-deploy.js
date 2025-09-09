#!/usr/bin/env node

/**
 * Complete deployment script for Prediction Market contracts on Celo Mainnet
 * 
 * This script:
 * 1. Compiles the Solidity contracts using solc
 * 2. Deploys PredictionMarketCore contract
 * 3. Deploys PredictionMarketClaims contract with Core reference
 * 4. Sets up the contract references
 * 5. Updates frontend configuration
 * 
 * Usage: node scripts/compile-and-deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Configuration
const PRIVATE_KEY = 'de02aea8dabb0cb2a0830ffb299f82fcdd8cf14d08563f2dfeaf378110a10f61';
const CELO_RPC_URL = 'https://forno.celo.org';

// Contract source files
const CONTRACTS = {
  PredictionMarketCore: {
    source: path.join(__dirname, '..', 'contracts', 'PredictionMarketCore.sol'),
    name: 'PredictionMarketCore'
  },
  PredictionMarketClaims: {
    source: path.join(__dirname, '..', 'contracts', 'PredictionMarketClaims.sol'),
    name: 'PredictionMarketClaims'
  }
};

async function installDependencies() {
  console.log('📦 Installing required dependencies...');
  
  try {
    // Check if solc is available
    execSync('solc --version', { stdio: 'pipe' });
    console.log('✅ solc is available');
  } catch (error) {
    console.log('📥 Installing solc...');
    execSync('npm install -g solc', { stdio: 'inherit' });
  }
}

async function compileContract(contractInfo) {
  console.log(`\n🔨 Compiling ${contractInfo.name}...`);
  
  const { source, name } = contractInfo;
  
  if (!fs.existsSync(source)) {
    throw new Error(`Contract source file not found: ${source}`);
  }
  
  try {
    // Compile the contract
    const compileCommand = `solc --bin --abi --optimize --optimize-runs 200 ${source}`;
    const output = execSync(compileCommand, { 
      encoding: 'utf8',
      cwd: path.dirname(source)
    });
    
    // Parse the output to extract bytecode and ABI
    const lines = output.split('\n');
    let bytecode = '';
    let abi = '';
    let inAbi = false;
    
    for (const line of lines) {
      if (line.includes('Binary:')) {
        bytecode = lines[lines.indexOf(line) + 1].trim();
      }
      if (line.includes('Contract JSON ABI')) {
        inAbi = true;
        continue;
      }
      if (inAbi && line.trim().startsWith('[')) {
        abi = line.trim();
        break;
      }
    }
    
    if (!bytecode || !abi) {
      throw new Error(`Failed to extract bytecode or ABI for ${name}`);
    }
    
    console.log(`✅ ${name} compiled successfully`);
    
    return {
      bytecode: `0x${bytecode}`,
      abi: JSON.parse(abi)
    };
    
  } catch (error) {
    console.error(`❌ Failed to compile ${name}:`, error.message);
    throw error;
  }
}

async function deployContract(contractInfo, compiledContract, wallet, constructorArgs = []) {
  console.log(`\n🚀 Deploying ${contractInfo.name}...`);
  
  const { name } = contractInfo;
  const { bytecode, abi } = compiledContract;
  
  try {
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(...constructorArgs);
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log(`✅ ${name} deployed at: ${address}`);
    
    return {
      contract,
      address,
      abi
    };
    
  } catch (error) {
    console.error(`❌ Failed to deploy ${name}:`, error.message);
    throw error;
  }
}

async function updateFrontendConfig(coreAddress, claimsAddress) {
  console.log('\n🔧 Updating frontend configuration...');
  
  // Update the contract addresses in the hooks
  const hooksToUpdate = [
    'hooks/usePredictionMarket.ts',
    'hooks/useMarkets.ts',
    'hooks/useMarketTrading.ts'
  ];
  
  for (const hookPath of hooksToUpdate) {
    const fullPath = path.join(__dirname, '..', hookPath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Update the contract address
      content = content.replace(
        /NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO.*?0x[a-fA-F0-9]{40}/g,
        `NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO || '${coreAddress}'`
      );
      
      content = content.replace(
        /NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO.*?0x[a-fA-F0-9]{40}/g,
        `NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO || '${claimsAddress}'`
      );
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated ${hookPath}`);
    }
  }
  
  // Create/update .env.local file
  const envContent = `# Celo Mainnet Contract Addresses - Generated ${new Date().toISOString()}
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=${coreAddress}
NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=${claimsAddress}

# Previous addresses (for reference)
# NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO_OLD=0x2D6614fe45da6Aa7e60077434129a51631AC702A
# NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO_OLD=0x...`;

  const envFile = path.join(__dirname, '..', '.env.local');
  fs.writeFileSync(envFile, envContent);
  console.log(`✅ Updated .env.local`);
}

async function main() {
  try {
    console.log('🚀 Starting complete deployment process...\n');
    
    // Install dependencies
    await installDependencies();
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(CELO_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`📝 Deploying from account: ${wallet.address}`);
    
    // Check account balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Account balance: ${ethers.formatEther(balance)} CELO`);
    
    if (balance < ethers.parseEther('0.1')) {
      throw new Error('Insufficient balance for deployment. Need at least 0.1 CELO for gas fees.');
    }
    
    // Compile contracts
    const compiledCore = await compileContract(CONTRACTS.PredictionMarketCore);
    const compiledClaims = await compileContract(CONTRACTS.PredictionMarketClaims);
    
    // Deploy core contract
    const coreDeployment = await deployContract(
      CONTRACTS.PredictionMarketCore,
      compiledCore,
      wallet
    );
    
    // Deploy claims contract with core address
    const claimsDeployment = await deployContract(
      CONTRACTS.PredictionMarketClaims,
      compiledClaims,
      wallet,
      [coreDeployment.address]
    );
    
    // Set claims contract reference in core
    console.log('\n🔗 Setting claims contract reference...');
    const setClaimsTx = await coreDeployment.contract.setClaimsContract(claimsDeployment.address);
    await setClaimsTx.wait();
    console.log('✅ Claims contract reference set');
    
    // Verify contracts
    console.log('\n🔍 Verifying contracts...');
    try {
      const marketCount = await coreDeployment.contract.getMarketCount();
      console.log(`✅ Core contract verified - Market count: ${marketCount}`);
      
      const claimsCoreRef = await claimsDeployment.contract.coreContract();
      console.log(`✅ Claims contract verified - Core reference: ${claimsCoreRef}`);
    } catch (error) {
      console.warn(`⚠️  Contract verification failed: ${error.message}`);
    }
    
    // Update frontend configuration
    await updateFrontendConfig(coreDeployment.address, claimsDeployment.address);
    
    // Save deployment info
    const deploymentInfo = {
      network: 'celo-mainnet',
      chainId: 42220,
      deployedAt: new Date().toISOString(),
      deployer: wallet.address,
      contracts: {
        PredictionMarketCore: {
          address: coreDeployment.address,
          transactionHash: coreDeployment.contract.deploymentTransaction()?.hash
        },
        PredictionMarketClaims: {
          address: claimsDeployment.address,
          transactionHash: claimsDeployment.contract.deploymentTransaction()?.hash
        }
      }
    };
    
    const deploymentFile = path.join(__dirname, '..', 'deployments', 'celo-mainnet.json');
    const deploymentsDir = path.dirname(deploymentFile);
    
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Core Contract: ${coreDeployment.address}`);
    console.log(`   Claims Contract: ${claimsDeployment.address}`);
    console.log(`   Network: Celo Mainnet (42220)`);
    console.log(`   Deployer: ${wallet.address}`);
    
    console.log('\n📝 Next steps:');
    console.log('   1. Test the contracts with a small transaction');
    console.log('   2. Verify contracts on Celo Explorer if needed');
    console.log('   3. Update any hardcoded addresses in the codebase');
    console.log('   4. Deploy to production environment');
    
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
