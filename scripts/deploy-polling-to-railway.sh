#!/bin/bash

echo "🚀 Deploying Polling Service to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    echo "railway login"
    exit 1
fi

echo "✅ Railway CLI found and user is logged in"

# Create new project if it doesn't exist
echo "📁 Creating Railway project..."
railway init --name "snarkels-polling-service" || echo "Project already exists or using existing project"

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set ENABLE_POLLING=true
railway variables set NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
railway variables set NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=0x7176D16D61A122231a78749c61740ad8F86BB13a
railway variables set NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6

echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "📊 Monitor your service at: https://railway.app/dashboard"
echo "📝 View logs with: railway logs"
echo "🔄 Restart service with: railway restart"

echo ""
echo "🎉 Your polling service is now running on Railway!"
echo "💡 It will automatically detect and sync new markets to your database."
