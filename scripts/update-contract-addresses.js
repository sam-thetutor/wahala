#!/usr/bin/env node

/**
 * Script to update contract addresses in the frontend
 * 
 * This script updates the frontend configuration with new contract addresses
 * while preserving the old ones for reference.
 * 
 * Usage: node scripts/update-contract-addresses.js <core-address> <claims-address>
 */

const fs = require('fs');
const path = require('path');

// Get contract addresses from command line arguments
const coreAddress = process.argv[2];
const claimsAddress = process.argv[3];

if (!coreAddress || !claimsAddress) {
  console.error('❌ Usage: node scripts/update-contract-addresses.js <core-address> <claims-address>');
  console.error('   Example: node scripts/update-contract-addresses.js 0x1234... 0x5678...');
  process.exit(1);
}

// Validate addresses
const addressRegex = /^0x[a-fA-F0-9]{40}$/;
if (!addressRegex.test(coreAddress) || !addressRegex.test(claimsAddress)) {
  console.error('❌ Invalid contract addresses. Must be valid Ethereum addresses (0x...)');
  process.exit(1);
}

console.log('🔧 Updating contract addresses in frontend...');
console.log(`   Core Contract: ${coreAddress}`);
console.log(`   Claims Contract: ${claimsAddress}`);

// Files to update
const filesToUpdate = [
  {
    path: 'hooks/usePredictionMarket.ts',
    patterns: [
      {
        search: /NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO.*?0x[a-fA-F0-9]{40}/g,
        replace: `NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO || '${coreAddress}'`
      },
      {
        search: /NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO.*?0x[a-fA-F0-9]{40}/g,
        replace: `NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO || '${claimsAddress}'`
      }
    ]
  },
  {
    path: 'hooks/useMarkets.ts',
    patterns: [
      {
        search: /NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO.*?0x[a-fA-F0-9]{40}/g,
        replace: `NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO || '${coreAddress}'`
      }
    ]
  },
  {
    path: 'hooks/useMarketTrading.ts',
    patterns: [
      {
        search: /NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO.*?0x[a-fA-F0-9]{40}/g,
        replace: `NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO || '${coreAddress}'`
      }
    ]
  }
];

// Update files
let updatedFiles = 0;
for (const fileInfo of filesToUpdate) {
  const fullPath = path.join(__dirname, '..', fileInfo.path);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let hasChanges = false;
    
    for (const pattern of fileInfo.patterns) {
      const newContent = content.replace(pattern.search, pattern.replace);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated ${fileInfo.path}`);
      updatedFiles++;
    } else {
      console.log(`⚠️  No changes needed in ${fileInfo.path}`);
    }
  } else {
    console.log(`⚠️  File not found: ${fileInfo.path}`);
  }
}

// Create/update .env.local file
const envContent = `# Celo Mainnet Contract Addresses - Updated ${new Date().toISOString()}
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=${coreAddress}
NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=${claimsAddress}

# Previous addresses (for reference)
# NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO_OLD=0x2D6614fe45da6Aa7e60077434129a51631AC702A
# NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO_OLD=0x...`;

const envFile = path.join(__dirname, '..', '.env.local');
fs.writeFileSync(envFile, envContent);
console.log(`✅ Updated .env.local`);

// Save deployment info
const deploymentInfo = {
  network: 'celo-mainnet',
  chainId: 42220,
  updatedAt: new Date().toISOString(),
  contracts: {
    PredictionMarketCore: {
      address: coreAddress,
      previousAddress: '0x2D6614fe45da6Aa7e60077434129a51631AC702A'
    },
    PredictionMarketClaims: {
      address: claimsAddress,
      previousAddress: '0x...' // Add previous claims address if known
    }
  }
};

const deploymentFile = path.join(__dirname, '..', 'deployments', 'celo-mainnet-update.json');
const deploymentsDir = path.dirname(deploymentFile);

if (!fs.existsSync(deploymentsDir)) {
  fs.mkdirSync(deploymentsDir, { recursive: true });
}

fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
console.log(`✅ Deployment info saved to: ${deploymentFile}`);

console.log('\n🎉 Contract address update completed!');
console.log(`\n📋 Summary:`);
console.log(`   Core Contract: ${coreAddress}`);
console.log(`   Claims Contract: ${claimsAddress}`);
console.log(`   Files updated: ${updatedFiles + 1}`); // +1 for .env.local

console.log('\n📝 Next steps:');
console.log('   1. Test the application with the new contract addresses');
console.log('   2. Verify the contracts are working correctly');
console.log('   3. Deploy to production if everything looks good');
console.log('   4. Update any documentation with the new addresses');
