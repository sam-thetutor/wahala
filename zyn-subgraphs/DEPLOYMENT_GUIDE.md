# Subgraph Deployment Guide

## Step-by-Step Deployment Instructions

### **Step 1: Create Subgraph in The Graph Studio**

1. **Go to The Graph Studio**
   - Visit: https://thegraph.com/studio/
   - Connect your wallet (same wallet that deployed the contract)

2. **Create New Subgraph**
   - Click "Create a Subgraph"
   - **Name**: `core`
   - **Network**: Celo
   - **Contract Address**: `0x35f61008878b85B4239C1EF714989B236757a283`

3. **Get Deploy Key**
   - Copy the deploy key from the studio
   - It looks like: `c676d07753a3d7bfe1ca4899ed31ef39`

### **Step 2: Authenticate with The Graph CLI**

```bash
# Use the deploy key from Step 1
graph auth <YOUR_DEPLOY_KEY>
```

### **Step 3: Deploy the Subgraph**

```bash
# Deploy using the deploy key
graph deploy --deploy-key <YOUR_DEPLOY_KEY> core
```

### **Step 4: Verify Deployment**

1. **Check The Graph Studio**
   - Go to your subgraph dashboard
   - Verify it's syncing blocks
   - Check that events are being indexed

2. **Test Queries**
   - Use the GraphQL playground in the studio
   - Try the sample queries from the README

## Alternative: Deploy to Local Graph Node

If you want to test locally first:

```bash
# Start local graph node (requires Docker)
docker-compose up -d

# Deploy to local node
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 core
```

## Troubleshooting

### **"Subgraph not found" Error**
- Make sure you created the subgraph in The Graph Studio first
- Use the correct subgraph name: `core`

### **Authentication Errors**
- Make sure you're using the correct deploy key
- The deploy key should be from the subgraph you created

### **Build Errors**
- Make sure you're in the `zyn-subgraphs` directory
- Run `graph build` first to check for errors

## Next Steps After Deployment

1. **Wait for Sync**: The subgraph will start syncing from block 45500000
2. **Test Queries**: Use the GraphQL playground to test queries
3. **Update Frontend**: Replace API calls with subgraph queries
4. **Monitor**: Check the studio dashboard for indexing status

## Sample Queries to Test

```graphql
# Get all markets
query GetMarkets {
  markets {
    id
    question
    totalPool
    totalYes
    totalNo
    status
  }
}

# Get specific market
query GetMarket($id: ID!) {
  market(id: $id) {
    id
    question
    totalPool
    participants {
      user
      totalInvestment
    }
  }
}
```

Once deployed, your subgraph will automatically solve the data synchronization issues you're experiencing!
