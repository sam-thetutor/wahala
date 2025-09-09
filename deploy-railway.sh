#!/bin/bash

echo "🚀 Deploying Polling Service to Railway"
echo "========================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Run setup first
echo "🔧 Running setup checks..."
node scripts/setup-railway.js

if [ $? -ne 0 ]; then
    echo "❌ Setup failed. Please fix the issues above and try again."
    exit 1
fi

# Run the deployment script
echo "✅ Prerequisites met. Starting deployment..."
node scripts/deploy-to-railway.js
