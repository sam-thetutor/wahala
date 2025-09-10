# Zyn Prediction Markets Subgraph

This subgraph indexes events from the Zyn Prediction Market smart contract on Celo and provides real-time data for markets, participants, and transactions.

## What This Solves

### **Current Problems:**
1. **Database Sync Issues**: Your database gets out of sync with the smart contract
2. **Manual Transaction Processing**: You have to manually process each transaction
3. **Frontend Stuck on "Confirming"**: Transaction confirmation logic has timing issues
4. **Inconsistent Data**: Market totals show zeros even when users have participated

### **Subgraph Benefits:**
1. **Automatic Indexing**: All blockchain events are automatically indexed
2. **Real-time Updates**: Data stays in sync with the blockchain
3. **Aggregated Data**: Pre-calculated totals, participant stats, and market data
4. **Reliable Queries**: No more manual transaction processing needed

## Architecture

### **Entities:**
- **Market**: Aggregated market data with totals
- **Participant**: User participation in markets
- **User**: User profiles and statistics
- **GlobalStats**: Platform-wide statistics

### **Events Indexed:**
- `MarketCreated`: New markets
- `SharesBought`: Share purchases (automatically updates totals)
- `MarketResolved`: Market outcomes
- `UsernameSet/Changed`: User profile updates

## Deployment

### **1. Get The Graph Studio Access**
1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Connect your wallet
3. Create a new subgraph
4. Get your deploy key

### **2. Authenticate**
```bash
graph auth --studio <YOUR_DEPLOY_KEY>
```

### **3. Deploy**
```bash
./deploy.sh
```

## Usage in Your App

### **Replace Current API Calls:**

**Instead of:**
```typescript
// Current problematic approach
const response = await fetch('/api/markets/process-transaction', {
  method: 'POST',
  body: JSON.stringify({ transactionHash, marketId })
})
```

**Use:**
```typescript
// Query the subgraph directly
const query = `
  query GetMarket($id: ID!) {
    market(id: $id) {
      id
      question
      totalPool
      totalYes
      totalNo
      status
      participants {
        user
        totalInvestment
        totalYesShares
        totalNoShares
      }
    }
  }
`

const response = await fetch('https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { id: marketId } })
})
```

### **Real-time Updates:**
```typescript
// Subscribe to market updates
const subscription = `
  subscription MarketUpdates($marketId: ID!) {
    market(id: $marketId) {
      totalPool
      totalYes
      totalNo
      participants {
        totalInvestment
      }
    }
  }
`
```

## Benefits for Your Current Issues

### **1. Solves "Confirming..." Stuck Issue**
- No more manual transaction processing
- Data updates automatically when events are indexed
- Frontend can query subgraph instead of waiting for API calls

### **2. Fixes Database Sync Issues**
- Subgraph is always in sync with blockchain
- No more manual `updateMarketTotals` calls
- Automatic calculation of totals from events

### **3. Improves Performance**
- Pre-aggregated data
- No need to fetch transaction receipts
- Faster queries than direct blockchain calls

### **4. Better User Experience**
- Real-time updates
- Consistent data across all pages
- No more zeros showing for participated markets

## Next Steps

1. **Deploy the subgraph** using the instructions above
2. **Update your frontend** to query the subgraph instead of your API
3. **Remove the problematic transaction processing** code
4. **Test with a real transaction** to see the automatic updates

## Queries You Can Use

### **Get All Markets:**
```graphql
query GetMarkets {
  markets {
    id
    question
    totalPool
    totalYes
    totalNo
    status
    creator
    createdAt
  }
}
```

### **Get Market Details:**
```graphql
query GetMarket($id: ID!) {
  market(id: $id) {
    id
    question
    description
    totalPool
    totalYes
    totalNo
    status
    participants {
      user
      totalInvestment
      totalYesShares
      totalNoShares
    }
  }
}
```

### **Get User Stats:**
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    username
    totalMarketsCreated
    totalMarketsParticipated
    totalInvestment
    participations {
      market {
        id
        question
      }
      totalInvestment
    }
  }
}
```

This subgraph will solve your current data synchronization issues and provide a much more reliable foundation for your prediction market application.
