# Railway Deployment Guide - Polling Service

## Deploy Only the Polling Service

This guide shows how to deploy just the polling service to Railway, which will handle automatic market syncing.

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install with `npm install -g @railway/cli`
3. **Environment Variables**: Set up your Supabase and contract configuration

### Step 1: Login to Railway

```bash
railway login
```

### Step 2: Create New Project

```bash
railway init
```

### Step 3: Set Environment Variables

Set these environment variables in Railway dashboard or via CLI:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Contract Addresses
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=0x7176D16D61A122231a78749c61740ad8F86BB13a
NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6

# Enable Polling
ENABLE_POLLING=true
```

### Step 4: Deploy

```bash
railway up
```

### Step 5: Monitor the Service

The polling service will:
- ✅ Start automatically when deployed
- ✅ Poll blockchain every 10 seconds for new markets
- ✅ Automatically sync new markets to database
- ✅ Restart automatically if it crashes
- ✅ Log all activity for monitoring

### Monitoring

Check the Railway dashboard to see:
- Service status and health
- Real-time logs
- Resource usage
- Restart history

### Benefits of Railway for Polling Service

1. **Long-running processes**: Unlike Vercel, Railway supports persistent background services
2. **Automatic restarts**: Service restarts if it crashes
3. **Easy monitoring**: Built-in logging and metrics
4. **Cost-effective**: Pay only for what you use
5. **Simple deployment**: One command deployment

### Manual Control

You can also control the service via Railway CLI:

```bash
# View logs
railway logs

# Restart service
railway restart

# Check status
railway status
```

### Troubleshooting

If the service isn't working:

1. Check environment variables are set correctly
2. Verify Supabase connection
3. Check logs for errors: `railway logs`
4. Restart the service: `railway restart`

The polling service will automatically detect and sync any new markets created on the blockchain to your Supabase database!
