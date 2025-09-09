const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment to Celo Mainnet...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying from account: ${deployer.address}`);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} CELO`);

  if (balance < ethers.parseEther("0.1")) {
    throw new Error("Insufficient balance for deployment. Need at least 0.1 CELO for gas fees.");
  }

  try {
    // Step 1: Deploy PredictionMarketCore
    console.log("\n📦 Deploying PredictionMarketCore contract...");
    
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const coreContract = await PredictionMarketCore.deploy();
    await coreContract.waitForDeployment();
    
    const coreAddress = await coreContract.getAddress();
    console.log(`✅ PredictionMarketCore deployed at: ${coreAddress}`);

    // Step 2: Deploy PredictionMarketClaims with Core contract address
    console.log("\n📦 Deploying PredictionMarketClaims contract...");
    
    const PredictionMarketClaims = await ethers.getContractFactory("PredictionMarketClaims");
    const claimsContract = await PredictionMarketClaims.deploy(coreAddress);
    await claimsContract.waitForDeployment();
    
    const claimsAddress = await claimsContract.getAddress();
    console.log(`✅ PredictionMarketClaims deployed at: ${claimsAddress}`);

    // Step 3: Set the claims contract in the core contract
    console.log("\n🔗 Setting claims contract reference in core contract...");
    
    const setClaimsTx = await coreContract.setClaimsContract(claimsAddress);
    await setClaimsTx.wait();
    
    console.log(`✅ Claims contract reference set successfully`);

    // Step 4: Verify contracts
    console.log("\n🔍 Verifying contracts...");
    
    try {
      const marketCount = await coreContract.getMarketCount();
      console.log(`✅ Core contract verified - Market count: ${marketCount}`);

      const claimsCoreRef = await claimsContract.coreContract();
      console.log(`✅ Claims contract verified - Core reference: ${claimsCoreRef}`);
    } catch (error) {
      console.warn(`⚠️  Contract verification failed: ${error.message}`);
    }

    // Step 5: Save deployment info
    const deploymentInfo = {
      network: "celo-mainnet",
      chainId: 42220,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        PredictionMarketCore: {
          address: coreAddress,
          transactionHash: coreContract.deploymentTransaction()?.hash
        },
        PredictionMarketClaims: {
          address: claimsAddress,
          transactionHash: claimsContract.deploymentTransaction()?.hash
        }
      }
    };

    // Save to file
    const deploymentFile = path.join(process.cwd(), "deployments", "celo-mainnet.json");
    const deploymentsDir = path.dirname(deploymentFile);
    
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

    // Step 6: Generate environment variables
    const envContent = `# Celo Mainnet Contract Addresses - Generated ${new Date().toISOString()}
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=${coreAddress}
NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=${claimsAddress}

# Previous addresses (for reference)
# NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO_OLD=0x2D6614fe45da6Aa7e60077434129a51631AC702A
# NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO_OLD=0x...`;

    const envFile = path.join(process.cwd(), ".env.local");
    fs.writeFileSync(envFile, envContent);
    console.log(`📝 Environment variables saved to: ${envFile}`);

    // Step 7: Update frontend configuration
    console.log("\n🔧 Updating frontend configuration...");
    
    const hooksToUpdate = [
      "hooks/usePredictionMarket.ts",
      "hooks/useMarkets.ts",
      "hooks/useMarketTrading.ts"
    ];
    
    for (const hookPath of hooksToUpdate) {
      const fullPath = path.join(process.cwd(), hookPath);
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, "utf8");
        
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

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   Core Contract: ${coreAddress}`);
    console.log(`   Claims Contract: ${claimsAddress}`);
    console.log(`   Network: Celo Mainnet (42220)`);
    console.log(`   Deployer: ${deployer.address}`);
    
    console.log("\n📝 Next steps:");
    console.log("   1. Test the contracts with a small transaction");
    console.log("   2. Verify contracts on Celo Explorer if needed");
    console.log("   3. Update any hardcoded addresses in the codebase");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
