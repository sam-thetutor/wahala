#!/bin/bash

# Automated subgraph deployment script
echo "🚀 Automated Subgraph Deployment"
echo "================================="

# Check if Graph CLI is installed
if ! command -v graph &> /dev/null; then
    echo "❌ Graph CLI not found. Installing..."
    npm install -g @graphprotocol/graph-cli
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Graph CLI. Please install manually:"
        echo "   npm install -g @graphprotocol/graph-cli"
        exit 1
    fi
fi

echo "✅ Graph CLI found"

# Check if deploy key is provided
if [ -z "$1" ]; then
    echo "❌ Deploy key required!"
    echo "Usage: ./deploy-auto.sh <YOUR_DEPLOY_KEY>"
    echo ""
    echo "To get your deploy key:"
    echo "1. Go to https://thegraph.com/studio/"
    echo "2. Connect your wallet"
    echo "3. Create a subgraph named 'core'"
    echo "4. Copy the deploy key"
    exit 1
fi

DEPLOY_KEY=$1

echo "🔐 Authenticating with deploy key..."
graph auth $DEPLOY_KEY

if [ $? -ne 0 ]; then
    echo "❌ Authentication failed. Please check your deploy key."
    exit 1
fi

echo "✅ Authentication successful"

echo "📦 Building subgraph..."
graph codegen
if [ $? -ne 0 ]; then
    echo "❌ Code generation failed"
    exit 1
fi

graph build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

echo "🚀 Deploying subgraph..."
graph deploy --deploy-key $DEPLOY_KEY core

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "📊 View your subgraph at:"
    echo "   https://thegraph.com/studio/subgraph/core"
    echo ""
    echo "⏳ The subgraph will start syncing from block 45500000"
    echo "   You can monitor the sync progress in The Graph Studio"
else
    echo "❌ Deployment failed"
    exit 1
fi
