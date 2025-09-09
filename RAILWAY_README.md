# Railway Deployment - Polling Service

## Quick Start

Deploy the polling service to Railway with one command:

```bash
./deploy-railway.sh
```

## What This Deploys

- ✅ **Polling Service Only** - Just the background service that syncs markets
- ✅ **Automatic Market Detection** - Polls blockchain every 10 seconds
- ✅ **Database Syncing** - Automatically syncs new markets to Supabase
- ✅ **Auto-Restart** - Restarts if it crashes
- ✅ **Real-time Monitoring** - View logs and status in Railway dashboard

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Environment Variables**: Make sure your `.env` file has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Manual Deployment

If you prefer to deploy manually:

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project
railway init --name snarkels-polling-service

# 4. Set environment variables
railway variables set ENABLE_POLLING=true
railway variables set NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=0x7176D16D61A122231a78749c61740ad8F86BB13a
railway variables set NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6

# 5. Deploy
railway up
```

## Monitoring

After deployment, monitor your service:

```bash
# View logs
railway logs

# Check status
railway status

# Restart service
railway restart
```

## Benefits of Railway

- 🚀 **Long-running processes** (unlike Vercel serverless)
- 💰 **Cost-effective** (pay only for usage)
- 🔄 **Auto-restart** on failures
- 📊 **Built-in monitoring** and logs
- ⚡ **Simple deployment** with one command

## Troubleshooting

If deployment fails:

1. **Check Railway CLI**: `railway --version`
2. **Verify login**: `railway whoami`
3. **Check environment variables**: Make sure `.env` file exists
4. **View Railway dashboard**: Check for error details

## What Happens After Deployment

The polling service will:
1. Start automatically when deployed
2. Connect to Celo blockchain
3. Poll every 10 seconds for new `MarketCreated` events
4. Automatically sync new markets to your Supabase database
5. Log all activity for monitoring
6. Restart automatically if it crashes

Your markets will now sync automatically! 🎉
