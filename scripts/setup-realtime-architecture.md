# Real-Time Prediction Market Architecture Setup

## 🏗️ Architecture Overview

This system implements a hybrid blockchain-database architecture:

1. **Market Creation**: Users create markets directly on the blockchain
2. **Event Tracking**: Background service listens for `MarketCreated` events
3. **Database Sync**: When events are detected, markets are automatically synced to Supabase
4. **Data Fetching**: Frontend fetches data from the database (fast) instead of blockchain (slow)

## 📁 New Files Created

### Backend Services
- `lib/eventListener.ts` - Event listener service for tracking blockchain events
- `lib/marketCreation.ts` - Service for creating markets on blockchain
- `lib/database.ts` - Database service for CRUD operations
- `lib/supabase.ts` - Supabase client configuration

### API Routes
- `app/api/markets/create/route.ts` - API for market creation transactions

### Frontend Components
- `hooks/useMarketCreation.ts` - React hook for market creation
- `components/CreateMarketForm.tsx` - Market creation form component
- `app/create-market/page.tsx` - Create market page

### Scripts
- `scripts/event-listener-service.js` - Background service for event listening
- `scripts/sync-to-database.js` - One-time sync script

## 🚀 Setup Instructions

### 1. Set Up Supabase Database

Follow the instructions in `scripts/setup-supabase.md` to:
- Create a Supabase project
- Set up environment variables
- Create database tables
- Run the initial sync

### 2. Environment Variables

Add these to your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_database_url

# Optional: For server-side market creation
ADMIN_WALLET_PRIVATE_KEY=your_private_key
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Application

```bash
# Start all services (Next.js + Event Listener + Socket Server + Worker)
pnpm dev

# Or start individual services:
pnpm dev:next          # Next.js only
pnpm event:listener    # Event listener only
pnpm sync:markets      # One-time sync
```

## 🔄 How It Works

### Market Creation Flow

1. **User fills form** → `CreateMarketForm.tsx`
2. **Frontend calls API** → `/api/markets/create`
3. **API returns transaction data** → Ready for wallet signing
4. **User signs transaction** → Transaction sent to blockchain
5. **Event listener detects** → `MarketCreated` event
6. **Database updates** → Market synced to Supabase
7. **UI refreshes** → New market appears in list

### Event Listening

The `event-listener-service.js` runs in the background and:
- Listens for `MarketCreated` events on the blockchain
- Fetches complete market data when events are detected
- Updates the Supabase database
- Records event metadata for tracking

### Data Fetching

- **Homepage**: Fetches stats and trending markets from database
- **Markets Page**: Fetches paginated markets with filters from database
- **Individual Markets**: Fetches from database for fast loading

## 🧪 Testing the Flow

### 1. Test Market Creation

1. Go to `http://localhost:3000/create-market`
2. Connect your wallet
3. Fill out the market creation form
4. Sign the transaction
5. Wait for confirmation

### 2. Verify Event Detection

Check the console logs for:
```
🎧 Starting event listener for market creation...
📢 Market creation event detected: [...]
📝 New market created: ID X, Question: ...
✅ Market X saved to database
```

### 3. Verify Database Update

1. Check your Supabase dashboard
2. Look at the `markets` table
3. Verify the new market appears
4. Check the `market_events` table for event records

### 4. Verify Frontend Update

1. Go to `http://localhost:3000/markets`
2. Verify the new market appears in the list
3. Check that stats are updated on the homepage

## 🔧 Troubleshooting

### Event Listener Not Working

1. Check Supabase environment variables
2. Verify the contract address is correct
3. Check console logs for errors
4. Ensure the service is running: `pnpm event:listener`

### Market Creation Failing

1. Check wallet connection
2. Verify you have enough CELO for gas
3. Check the transaction in Celo Explorer
4. Verify the contract ABI is correct

### Database Sync Issues

1. Check Supabase connection
2. Verify table permissions
3. Check console logs for sync errors
4. Run manual sync: `pnpm sync:markets`

### Frontend Not Updating

1. Check if API is returning data: `curl http://localhost:3000/api/markets`
2. Verify database has the latest data
3. Check browser console for errors
4. Ensure the event listener is running

## 📊 Monitoring

### Event Listener Status

The event listener logs important events:
- `✅ Event listener started successfully`
- `📢 Market creation event detected`
- `✅ Market X saved to database`
- `❌ Error processing market creation event`

### Database Health

Check Supabase dashboard for:
- Table row counts
- Recent inserts/updates
- Error logs
- Performance metrics

### API Health

Test the API endpoints:
```bash
# Test markets API
curl http://localhost:3000/api/markets

# Test market creation API
curl -X POST http://localhost:3000/api/markets/create \
  -H "Content-Type: application/json" \
  -d '{"question":"Test market","endTime":1234567890,"description":"Test","category":"Other"}'
```

## 🚀 Production Deployment

### 1. Environment Setup

- Set up production Supabase project
- Configure production environment variables
- Set up proper database permissions

### 2. Event Listener Deployment

- Deploy the event listener as a background service
- Set up monitoring and alerting
- Configure auto-restart on failure

### 3. Database Optimization

- Set up proper indexes
- Configure connection pooling
- Set up backup strategies

### 4. Monitoring

- Set up logging aggregation
- Configure error tracking
- Set up performance monitoring

## 🔄 Maintenance

### Regular Tasks

1. **Monitor event listener** - Ensure it's running and processing events
2. **Check database health** - Monitor performance and storage
3. **Update contract ABI** - If the contract is updated
4. **Sync verification** - Periodically verify data consistency

### Scaling Considerations

- **Event Listener**: Can run multiple instances for redundancy
- **Database**: Supabase handles scaling automatically
- **API**: Next.js API routes scale with your deployment
- **Frontend**: CDN and caching for better performance

This architecture provides the best of both worlds: the security and decentralization of blockchain for market creation, and the speed and reliability of a database for data fetching.







