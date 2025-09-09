# Celo Mainnet Deployment Guide

This guide explains how to deploy the Prediction Market contracts to Celo Mainnet and update the frontend configuration.

## Prerequisites

1. **Private Key**: The deployment account private key is provided: `de02aea8dabb0cb2a0830ffb299f82fcdd8cf14d08563f2dfeaf378110a10f61`
2. **Account Address**: `0x21D654daaB0fe1be0e584980ca7C1a382850939f`
3. **CELO Balance**: Ensure the account has sufficient CELO for gas fees (at least 0.1 CELO)
4. **Node.js**: Make sure Node.js and npm are installed

## Deployment Options

### Option 1: Manual Deployment with Foundry (Recommended)

1. **Install Foundry**:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Compile contracts**:
   ```bash
   forge build
   ```

4. **Deploy contracts**:
   ```bash
   # Deploy PredictionMarketCore
   forge create --rpc-url https://forno.celo.org --private-key 0xde02aea8dabb0cb2a0830ffb299f82fcdd8cf14d08563f2dfeaf378110a10f61 --verify --etherscan-api-key "" contracts/PredictionMarketCore.sol:PredictionMarketCore

   # Deploy PredictionMarketClaims (replace CORE_ADDRESS with the address from step 1)
   forge create --rpc-url https://forno.celo.org --private-key 0xde02aea8dabb0cb2a0830ffb299f82fcdd8cf14d08563f2dfeaf378110a10f61 --verify --etherscan-api-key "" --constructor-args CORE_ADDRESS contracts/PredictionMarketClaims.sol:PredictionMarketClaims
   ```

5. **Set claims contract reference**:
   ```bash
   cast send CORE_ADDRESS "setClaimsContract(address)" CLAIMS_ADDRESS --rpc-url https://forno.celo.org --private-key 0xde02aea8dabb0cb2a0830ffb299f82fcdd8cf14d08563f2dfeaf378110a10f61
   ```

### Option 2: Using the Deployment Scripts

1. **Run the complete deployment script**:
   ```bash
   node scripts/compile-and-deploy.js
   ```

2. **Or use the Foundry-based script**:
   ```bash
   node scripts/deploy-celo-foundry.js
   ```

### Option 3: Manual Contract Address Update

If you already have deployed contracts and just need to update the frontend:

```bash
node scripts/update-contract-addresses.js <core-address> <claims-address>
```

## Contract Addresses

After deployment, you'll get two contract addresses:
- **PredictionMarketCore**: The main contract for market creation and trading
- **PredictionMarketClaims**: The contract for handling winnings claims

## Frontend Configuration Update

The deployment scripts automatically update the following files:

1. **Environment Variables** (`.env.local`):
   ```env
   NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=<core-address>
   NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=<claims-address>
   ```

2. **Hook Files**:
   - `hooks/usePredictionMarket.ts`
   - `hooks/useMarkets.ts`
   - `hooks/useMarketTrading.ts`

3. **Deployment Info** (`deployments/celo-mainnet.json`):
   - Contract addresses
   - Transaction hashes
   - Deployment metadata

## Verification Steps

1. **Check Contract Deployment**:
   ```bash
   cast call <core-address> "getMarketCount()" --rpc-url https://forno.celo.org
   ```

2. **Verify Claims Contract Reference**:
   ```bash
   cast call <claims-address> "coreContract()" --rpc-url https://forno.celo.org
   ```

3. **Test Frontend**:
   - Start the development server: `npm run dev`
   - Test market creation
   - Test share buying
   - Test claims functionality

## Security Considerations

1. **Private Key**: The private key is provided for deployment only. After deployment, consider:
   - Transferring ownership to a multisig wallet
   - Using a hardware wallet for future operations
   - Keeping the private key secure

2. **Contract Verification**: Verify contracts on Celo Explorer for transparency

3. **Testing**: Thoroughly test all functionality before announcing the new deployment

## Troubleshooting

### Common Issues

1. **Insufficient Gas**: Ensure the account has enough CELO for gas fees
2. **Compilation Errors**: Make sure all dependencies are installed
3. **Network Issues**: Check Celo RPC endpoint availability
4. **Contract Verification**: Some contracts may need manual verification

### Getting Help

1. Check the deployment logs for specific error messages
2. Verify contract addresses on Celo Explorer
3. Test with small amounts first
4. Check the Celo network status

## Post-Deployment Checklist

- [ ] Contracts deployed successfully
- [ ] Contract addresses updated in frontend
- [ ] Frontend tested with new contracts
- [ ] Old contract addresses preserved for reference
- [ ] Deployment info saved
- [ ] Contracts verified on Celo Explorer (optional)
- [ ] Security review completed
- [ ] Production deployment tested

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate**: Update frontend to use old contract addresses
2. **Investigation**: Analyze the issues with the new contracts
3. **Fix**: Deploy corrected contracts if needed
4. **Update**: Switch back to new contracts once fixed

The old contract addresses are preserved in the codebase for easy rollback.
