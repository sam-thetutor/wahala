#!/usr/bin/env node

/**
 * Deployment script for Prediction Market contracts on Celo Mainnet
 * 
 * This script deploys:
 * 1. PredictionMarketCore contract
 * 2. PredictionMarketClaims contract (with reference to Core)
 * 
 * Usage: node scripts/deploy-celo-mainnet.js
 */

const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { celo } = require('viem/chains');
const fs = require('fs');
const path = require('path');

// Configuration
const PRIVATE_KEY = 'de02aea8dabb0cb2a0830ffb299f82fcdd8cf14d08563f2dfeaf378110a10f61';
const CELO_RPC_URL = 'https://forno.celo.org';

// Contract bytecode and ABI (simplified - you'll need to compile the contracts first)
const PREDICTION_MARKET_CORE_BYTECODE = '0x608060405234801561001057600080fd5b50600436106100365760003560e01c806301ffc9a71461003b5780637b1039991461006b575b600080fd5b6100566100493660046101a1565b6001600160e01b03191660009081526020819052604090205460ff1690565b60405190151581526020015b60405180910390f35b61007361007d565b60405161006291906101d1565b600080546001600160a01b031690565b60006001600160a01b0382166100a4576100a46100b5565b506001600160a01b031660009081526001602052604090205490565b6000546001600160a01b031633146100d95760405162461bcd60e51b81526004016100d0906101e4565b60405180910390fd5b600080546001600160a01b0319166001600160a01b0392909216919091179055565b60006020828403121561010b57600080fd5b81356001600160e01b03198116811461012357600080fd5b9392505050565b60006020828403121561013c57600080fd5b5035919050565b6000806040838503121561015657600080fd5b50508035926020909101359150565b6000815180845260005b8181101561018b5760208185018101518683018201520161016f565b8181111561019d576000602083870101525b50601f01601f19169290920160200192915050565b6020815260006101236020830184610165565b600081516101d5818560208601610169565b9290920192915050565b60208152600061012360208301846101c1565b6020808252818101527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260408201526060019056fea2646970667358221220...'; // This would be the actual compiled bytecode

const PREDICTION_MARKET_CLAIMS_BYTECODE = '0x608060405234801561001057600080fd5b50600436106100365760003560e01c806301ffc9a71461003b5780637b1039991461006b575b600080fd5b6100566100493660046101a1565b6001600160e01b03191660009081526020819052604090205460ff1690565b60405190151581526020015b60405180910390f35b61007361007d565b60405161006291906101d1565b600080546001600160a01b031690565b60006001600160a01b0382166100a4576100a46100b5565b506001600160a01b031660009081526001602052604090205490565b6000546001600160a01b031633146100d95760405162461bcd60e51b81526004016100d0906101e4565b60405180910390fd5b600080546001600160a01b0319166001600160a01b0392909216919091179055565b60006020828403121561010b57600080fd5b81356001600160e01b03198116811461012357600080fd5b9392505050565b60006020828403121561013c57600080fd5b5035919050565b6000806040838503121561015657600080fd5b50508035926020909101359150565b6000815180845260005b8181101561018b5760208185018101518683018201520161016f565b8181111561019d576000602083870101525b50601f01601f19169290920160200192915050565b6020815260006101236020830184610165565b600081516101d5818560208601610169565b9290920192915050565b60208152600061012360208301846101c1565b6020808252818101527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260408201526060019056fea2646970667358221220...'; // This would be the actual compiled bytecode

// Contract ABIs (simplified)
const PREDICTION_MARKET_CORE_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "getMarketCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const PREDICTION_MARKET_CLAIMS_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_coreContract", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "coreContract",
    "outputs": [{"internalType": "contract PredictionMarketCore", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  console.log('🚀 Starting deployment to Celo Mainnet...\n');

  // Create account from private key
  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
  console.log(`📝 Deploying from account: ${account.address}`);

  // Create clients
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(CELO_RPC_URL)
  });

  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(CELO_RPC_URL)
  });

  // Check account balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Account balance: ${formatEther(balance)} CELO`);

  if (balance < parseEther('0.1')) {
    throw new Error('Insufficient balance for deployment. Need at least 0.1 CELO for gas fees.');
  }

  try {
    // Step 1: Deploy PredictionMarketCore
    console.log('\n📦 Deploying PredictionMarketCore contract...');
    
    const coreDeploymentHash = await walletClient.deployContract({
      abi: PREDICTION_MARKET_CORE_ABI,
      bytecode: PREDICTION_MARKET_CORE_BYTECODE,
      account: account,
      args: []
    });

    console.log(`⏳ Core contract deployment transaction: ${coreDeploymentHash}`);
    
    // Wait for core contract deployment
    const coreReceipt = await publicClient.waitForTransactionReceipt({
      hash: coreDeploymentHash,
      confirmations: 2
    });

    const coreContractAddress = coreReceipt.contractAddress;
    console.log(`✅ PredictionMarketCore deployed at: ${coreContractAddress}`);

    // Step 2: Deploy PredictionMarketClaims with Core contract address
    console.log('\n📦 Deploying PredictionMarketClaims contract...');
    
    const claimsDeploymentHash = await walletClient.deployContract({
      abi: PREDICTION_MARKET_CLAIMS_ABI,
      bytecode: PREDICTION_MARKET_CLAIMS_BYTECODE,
      account: account,
      args: [coreContractAddress]
    });

    console.log(`⏳ Claims contract deployment transaction: ${claimsDeploymentHash}`);
    
    // Wait for claims contract deployment
    const claimsReceipt = await publicClient.waitForTransactionReceipt({
      hash: claimsDeploymentHash,
      confirmations: 2
    });

    const claimsContractAddress = claimsReceipt.contractAddress;
    console.log(`✅ PredictionMarketClaims deployed at: ${claimsContractAddress}`);

    // Step 3: Set the claims contract in the core contract
    console.log('\n🔗 Setting claims contract reference in core contract...');
    
    const setClaimsHash = await walletClient.writeContract({
      address: coreContractAddress,
      abi: PREDICTION_MARKET_CORE_ABI,
      functionName: 'setClaimsContract',
      args: [claimsContractAddress],
      account: account
    });

    console.log(`⏳ Set claims contract transaction: ${setClaimsHash}`);
    
    await publicClient.waitForTransactionReceipt({
      hash: setClaimsHash,
      confirmations: 2
    });

    console.log(`✅ Claims contract reference set successfully`);

    // Step 4: Save deployment info
    const deploymentInfo = {
      network: 'celo-mainnet',
      chainId: 42220,
      deployedAt: new Date().toISOString(),
      deployer: account.address,
      contracts: {
        PredictionMarketCore: {
          address: coreContractAddress,
          transactionHash: coreDeploymentHash,
          blockNumber: coreReceipt.blockNumber
        },
        PredictionMarketClaims: {
          address: claimsContractAddress,
          transactionHash: claimsDeploymentHash,
          blockNumber: claimsReceipt.blockNumber
        }
      },
      gasUsed: {
        core: coreReceipt.gasUsed.toString(),
        claims: claimsReceipt.gasUsed.toString()
      }
    };

    // Save to file
    const deploymentFile = path.join(__dirname, '..', 'deployments', 'celo-mainnet.json');
    const deploymentsDir = path.dirname(deploymentFile);
    
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

    // Step 5: Generate environment variables
    const envContent = `# Celo Mainnet Contract Addresses - Generated ${new Date().toISOString()}
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=${coreContractAddress}
NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=${claimsContractAddress}

# Previous addresses (for reference)
# NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO_OLD=0x2D6614fe45da6Aa7e60077434129a51631AC702A
# NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO_OLD=0x...`;

    const envFile = path.join(__dirname, '..', '.env.local.celo');
    fs.writeFileSync(envFile, envContent);
    console.log(`📝 Environment variables saved to: ${envFile}`);

    // Step 6: Verify contracts (basic verification)
    console.log('\n🔍 Verifying contracts...');
    
    try {
      const marketCount = await publicClient.readContract({
        address: coreContractAddress,
        abi: PREDICTION_MARKET_CORE_ABI,
        functionName: 'getMarketCount'
      });
      console.log(`✅ Core contract verified - Market count: ${marketCount}`);

      const claimsCoreRef = await publicClient.readContract({
        address: claimsContractAddress,
        abi: PREDICTION_MARKET_CLAIMS_ABI,
        functionName: 'coreContract'
      });
      console.log(`✅ Claims contract verified - Core reference: ${claimsCoreRef}`);
    } catch (error) {
      console.warn(`⚠️  Contract verification failed: ${error.message}`);
    }

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Core Contract: ${coreContractAddress}`);
    console.log(`   Claims Contract: ${claimsContractAddress}`);
    console.log(`   Network: Celo Mainnet (${celo.id})`);
    console.log(`   Deployer: ${account.address}`);
    
    console.log('\n📝 Next steps:');
    console.log('   1. Update your .env.local file with the new contract addresses');
    console.log('   2. Update the frontend configuration files');
    console.log('   3. Test the contracts with a small transaction');
    console.log('   4. Consider verifying the contracts on Celo Explorer');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run the deployment
main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
