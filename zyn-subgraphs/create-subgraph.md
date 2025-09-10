# Create Subgraph in The Graph Studio

## **You MUST create the subgraph in The Graph Studio first!**

The error "Subgraph not found" means the subgraph doesn't exist yet. Follow these steps:

### **Step 1: Go to The Graph Studio**
1. Visit: https://thegraph.com/studio/
2. Connect your wallet (same wallet that deployed your contract)

### **Step 2: Create New Subgraph**
1. Click **"Create a Subgraph"**
2. Fill in these details:
   - **Subgraph Name**: `zyn-prediction-markets`
   - **Network**: `Celo`
   - **Contract Address**: `0x7176D16D61A122231a78749c61740ad8F86BB13a`
   - **Start Block**: `45500000`

### **Step 3: Get Deploy Key**
1. After creating, you'll get a deploy key
2. Copy the deploy key (it will be different from the one you're using)

### **Step 4: Deploy**
```bash
# Use the NEW deploy key from the studio
graph deploy --deploy-key <NEW_DEPLOY_KEY> --node https://api.studio.thegraph.com/deploy/ zyn-prediction-markets
```

## **Why This Happens**

The Graph Studio requires you to create the subgraph through their web interface first. The deploy key you have (`c676d07753a3d7bfe1ca4899ed31ef39`) is either:
- From a different subgraph
- Expired
- Not associated with the `zyn-prediction-markets` subgraph

## **Alternative: Check Existing Subgraphs**

If you already have subgraphs, you can:
1. Go to https://thegraph.com/studio/
2. Check your existing subgraphs
3. Use the deploy key from an existing subgraph
4. Or create a new one with the name `zyn-prediction-markets`

## **After Creating the Subgraph**

Once you create it in the studio, the deployment command will work:

```bash
graph deploy --deploy-key <NEW_DEPLOY_KEY> --node https://api.studio.thegraph.com/deploy/ zyn-prediction-markets
```

The subgraph is built and ready - you just need to create it in The Graph Studio first!
