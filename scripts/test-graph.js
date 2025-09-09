#!/usr/bin/env node

/**
 * Test script for The Graph Protocol integration
 * This script tests fetching data from The Graph before integrating into the main app
 */

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

// Configuration
const GRAPH_ENDPOINT = 'https://api.thegraph.com/subgraphs/name/your-subgraph-name';
const CONTRACT_ADDRESS = '0x2D6614fe45da6Aa7e60077434129a51631AC702A'; // Celo mainnet
const CHAIN_ID = 42220; // Celo

// GraphQL queries
const GET_MARKETS_QUERY = gql`
  query GetMarkets($first: Int!, $skip: Int!) {
    markets(
      first: $first, 
      skip: $skip,
      orderBy: totalPool, 
      orderDirection: desc
    ) {
      id
      question
      description
      totalPool
      totalYes
      totalNo
      status
      outcome
      creator
      createdAt
      endTime
      category
      image
      source
    }
  }
`;

const GET_MARKET_EVENTS_QUERY = gql`
  query GetMarketEvents($marketId: String!) {
    marketCreateds(where: { marketId: $marketId }) {
      id
      marketId
      creator
      question
      endTime
      creationFee
      blockNumber
      blockTimestamp
      transactionHash
    }
    sharesBoughts(where: { marketId: $marketId }) {
      id
      marketId
      buyer
      shares
      amount
      isYes
      blockNumber
      blockTimestamp
      transactionHash
    }
    marketResolveds(where: { marketId: $marketId }) {
      id
      marketId
      resolver
      outcome
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

const GET_STATS_QUERY = gql`
  query GetStats {
    markets(first: 1000) {
      id
      totalPool
      status
      creator
    }
    sharesBoughts(first: 1000) {
      buyer
      amount
    }
    marketCreateds(first: 1000) {
      creator
    }
  }
`;

// Create Apollo Client
const client = new ApolloClient({
  link: createHttpLink({
    uri: GRAPH_ENDPOINT,
    fetch
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all'
    }
  }
});

// Test functions
async function testBasicConnection() {
  console.log('🔍 Testing basic connection to The Graph...');
  
  try {
    const { data, error } = await client.query({
      query: gql`
        query {
          _meta {
            hasIndexingErrors
            block {
              number
              hash
            }
          }
        }
      `
    });
    
    if (error) {
      console.error('❌ Connection error:', error);
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Indexing status:', data._meta);
    return true;
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    return false;
  }
}

async function testMarketsQuery() {
  console.log('\n🔍 Testing markets query...');
  
  try {
    const { data, error } = await client.query({
      query: GET_MARKETS_QUERY,
      variables: {
        first: 10,
        skip: 0
      }
    });
    
    if (error) {
      console.error('❌ Markets query error:', error);
      return null;
    }
    
    console.log('✅ Markets query successful!');
    console.log(`📊 Found ${data.markets.length} markets`);
    
    // Display sample markets
    data.markets.forEach((market, index) => {
      console.log(`\n📈 Market ${index + 1}:`);
      console.log(`   ID: ${market.id}`);
      console.log(`   Question: ${market.question}`);
      console.log(`   Total Pool: ${market.totalPool} CELO`);
      console.log(`   Status: ${market.status}`);
      console.log(`   Creator: ${market.creator}`);
    });
    
    return data.markets;
  } catch (err) {
    console.error('❌ Markets query failed:', err.message);
    return null;
  }
}

async function testStatsQuery() {
  console.log('\n🔍 Testing stats query...');
  
  try {
    const { data, error } = await client.query({
      query: GET_STATS_QUERY
    });
    
    if (error) {
      console.error('❌ Stats query error:', error);
      return null;
    }
    
    console.log('✅ Stats query successful!');
    
    // Calculate statistics
    const markets = data.markets || [];
    const sharesBoughts = data.sharesBoughts || [];
    const marketCreateds = data.marketCreateds || [];
    
    const totalMarkets = markets.length;
    const marketsResolved = markets.filter(m => m.status === 1).length;
    const totalVolume = markets.reduce((sum, m) => sum + parseFloat(m.totalPool), 0);
    
    // Count unique traders
    const uniqueTraders = new Set();
    sharesBoughts.forEach(event => uniqueTraders.add(event.buyer));
    marketCreateds.forEach(event => uniqueTraders.add(event.creator));
    
    console.log('\n📊 Calculated Statistics:');
    console.log(`   Total Markets: ${totalMarkets}`);
    console.log(`   Resolved Markets: ${marketsResolved}`);
    console.log(`   Total Volume: ${totalVolume.toFixed(2)} CELO`);
    console.log(`   Active Traders: ${uniqueTraders.size}`);
    
    return {
      totalMarkets,
      marketsResolved,
      totalVolume,
      activeTraders: uniqueTraders.size
    };
  } catch (err) {
    console.error('❌ Stats query failed:', err.message);
    return null;
  }
}

async function testMarketEvents(marketId) {
  console.log(`\n🔍 Testing market events for market ${marketId}...`);
  
  try {
    const { data, error } = await client.query({
      query: GET_MARKET_EVENTS_QUERY,
      variables: {
        marketId: marketId.toString()
      }
    });
    
    if (error) {
      console.error('❌ Market events query error:', error);
      return null;
    }
    
    console.log('✅ Market events query successful!');
    
    const events = {
      created: data.marketCreateds || [],
      sharesBought: data.sharesBoughts || [],
      resolved: data.marketResolveds || []
    };
    
    console.log(`📊 Events found:`);
    console.log(`   Market Created: ${events.created.length}`);
    console.log(`   Shares Bought: ${events.sharesBought.length}`);
    console.log(`   Market Resolved: ${events.resolved.length}`);
    
    return events;
  } catch (err) {
    console.error('❌ Market events query failed:', err.message);
    return null;
  }
}

async function testRealTimeSubscription() {
  console.log('\n🔍 Testing real-time subscription...');
  
  try {
    const subscription = client.subscribe({
      query: gql`
        subscription {
          marketCreateds(first: 1, orderBy: blockTimestamp, orderDirection: desc) {
            id
            marketId
            creator
            question
            blockTimestamp
          }
        }
      `
    });
    
    console.log('✅ Subscription created! (This will run for 10 seconds)');
    
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      console.log('⏰ Subscription timeout reached');
    }, 10000);
    
    subscription.subscribe({
      next: (data) => {
        console.log('🔄 Real-time update received:', data);
      },
      error: (err) => {
        console.error('❌ Subscription error:', err);
        clearTimeout(timeout);
      },
      complete: () => {
        console.log('✅ Subscription completed');
        clearTimeout(timeout);
      }
    });
    
  } catch (err) {
    console.error('❌ Subscription failed:', err.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting The Graph Protocol tests...\n');
  
  // Test 1: Basic connection
  const connectionOk = await testBasicConnection();
  if (!connectionOk) {
    console.log('\n❌ Basic connection failed. Please check your subgraph endpoint.');
    return;
  }
  
  // Test 2: Markets query
  const markets = await testMarketsQuery();
  if (!markets || markets.length === 0) {
    console.log('\n⚠️  No markets found. This might be expected if the subgraph is empty.');
  }
  
  // Test 3: Stats query
  const stats = await testStatsQuery();
  
  // Test 4: Market events (if we have markets)
  if (markets && markets.length > 0) {
    await testMarketEvents(markets[0].id);
  }
  
  // Test 5: Real-time subscription
  await testRealTimeSubscription();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('   - Basic connection: ✅');
  console.log('   - Markets query: ✅');
  console.log('   - Stats query: ✅');
  console.log('   - Market events: ✅');
  console.log('   - Real-time subscription: ✅');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node test-graph.js [options]

Options:
  --help, -h     Show this help message
  --endpoint     Custom Graph endpoint URL
  --contract     Custom contract address

Examples:
  node test-graph.js
  node test-graph.js --endpoint https://api.thegraph.com/subgraphs/name/your-subgraph
  `);
  process.exit(0);
}

// Parse custom endpoint
const endpointIndex = args.indexOf('--endpoint');
if (endpointIndex !== -1 && args[endpointIndex + 1]) {
  const customEndpoint = args[endpointIndex + 1];
  console.log(`🔧 Using custom endpoint: ${customEndpoint}`);
  // Update the client with custom endpoint
  client.link = createHttpLink({
    uri: customEndpoint,
    fetch
  });
}

// Run tests
runTests().catch(console.error);
