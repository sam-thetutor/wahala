#!/bin/bash

# Deploy subgraph to The Graph Studio
echo "🚀 Deploying subgraph to The Graph Studio..."

# First, you need to create the subgraph in The Graph Studio
echo "📝 Step 1: Create subgraph in The Graph Studio"
echo "   1. Go to https://thegraph.com/studio/"
echo "   2. Connect your wallet"
echo "   3. Click 'Create a Subgraph'"
echo "   4. Name it 'core'"
echo "   5. Copy the deploy key"

# Authenticate with the deploy key
echo "🔐 Step 2: Authenticate with deploy key"
echo "   Run: graph auth <YOUR_DEPLOY_KEY>"
echo "   (Replace <YOUR_DEPLOY_KEY> with the key from The Graph Studio)"

# Deploy the subgraph
echo "📦 Step 3: Deploy the subgraph"
echo "   Run: graph deploy --deploy-key <YOUR_DEPLOY_KEY> core"

echo ""
echo "📊 After deployment, you can view it at:"
echo "   https://thegraph.com/studio/subgraph/core"