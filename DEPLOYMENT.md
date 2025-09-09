# Deployment Guide

## Automatic Polling Service Setup

The polling service will automatically start when the application is deployed. Here's how it works:

### Environment Variables

Set these environment variables in your deployment platform:

```bash
# Enable polling service (required for production)
ENABLE_POLLING=true

# Supabase configuration (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Contract addresses (already configured)
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS_CELO=0x7176D16D61A122231a78749c61740ad8F86BB13a
NEXT_PUBLIC_PREDICTION_MARKET_CLAIMS_ADDRESS_CELO=0x1e1ac759e75dA03a39f16ae72B73279A1edf63d6
```

### How It Works

1. **Automatic Startup**: The polling service starts automatically when the application starts (in production)
2. **Event Detection**: Polls the blockchain every 10 seconds for new `MarketCreated` events
3. **Auto Sync**: Automatically syncs new markets to the database
4. **Error Recovery**: Restarts automatically if it crashes (in production)

### Deployment Platforms

#### Vercel
- The polling service will start automatically
- Set `ENABLE_POLLING=true` in your Vercel environment variables
- The service runs as part of the Next.js application

#### Other Platforms
- The polling service will start automatically when `NODE_ENV=production` or `ENABLE_POLLING=true`
- Make sure to set the required environment variables

### Manual Control

You can also control the polling service via API:

```bash
# Check status
curl http://your-domain.com/api/polling/status

# Start service (if not running)
curl -X POST http://your-domain.com/api/polling/start

# Stop service
curl -X DELETE http://your-domain.com/api/polling/start
```

### Monitoring

The polling service logs its activity. In production, you should see logs like:
- `🔍 Polling blocks X to Y`
- `📢 Found N new MarketCreated events`
- `✅ Market X synced to database successfully`

### Troubleshooting

If markets aren't syncing automatically:

1. Check that `ENABLE_POLLING=true` is set
2. Verify Supabase environment variables are correct
3. Check the polling service status: `curl http://your-domain.com/api/polling/status`
4. Look for error logs in your deployment platform

### Local Development

For local development, start the polling service manually:

```bash
node scripts/start-polling-service.js
```

Or set `ENABLE_POLLING=true` in your `.env.local` file.
