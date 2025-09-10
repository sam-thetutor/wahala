const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function recreateTables() {
  try {
    console.log('🗑️ Dropping existing tables...')
    
    // Drop tables in reverse order (due to foreign key constraints)
    const dropQueries = [
      'DROP TABLE IF EXISTS market_events CASCADE;',
      'DROP TABLE IF EXISTS sync_status CASCADE;',
      'DROP TABLE IF EXISTS markets CASCADE;'
    ]
    
    for (const query of dropQueries) {
      console.log(`📝 Executing: ${query}`)
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.log(`⚠️  Warning: ${error.message}`)
      } else {
        console.log('✅ Executed successfully')
      }
    }
    
    console.log('\n🏗️ Creating new tables...')
    
    // Create markets table
    const createMarketsQuery = `
      CREATE TABLE markets (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        endTime TEXT NOT NULL,
        totalPool TEXT NOT NULL,
        totalYes TEXT NOT NULL,
        totalNo TEXT NOT NULL,
        status INTEGER NOT NULL,
        outcome BOOLEAN NOT NULL,
        createdAt TEXT NOT NULL,
        creator TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        image TEXT NOT NULL,
        source TEXT NOT NULL,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    console.log('📝 Creating markets table...')
    const { error: marketsError } = await supabase.rpc('exec_sql', { sql: createMarketsQuery })
    if (marketsError) {
      console.error('❌ Error creating markets table:', marketsError)
      return
    }
    console.log('✅ Markets table created')
    
    // Create market_events table
    const createEventsQuery = `
      CREATE TABLE market_events (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        marketId TEXT NOT NULL,
        eventType TEXT NOT NULL,
        blockNumber TEXT NOT NULL,
        transactionHash TEXT NOT NULL,
        args TEXT NOT NULL,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    console.log('📝 Creating market_events table...')
    const { error: eventsError } = await supabase.rpc('exec_sql', { sql: createEventsQuery })
    if (eventsError) {
      console.error('❌ Error creating market_events table:', eventsError)
      return
    }
    console.log('✅ Market_events table created')
    
    // Create sync_status table
    const createSyncQuery = `
      CREATE TABLE sync_status (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        lastSyncBlock TEXT NOT NULL,
        lastSyncTime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        isActive BOOLEAN DEFAULT true
      );
    `
    
    console.log('📝 Creating sync_status table...')
    const { error: syncError } = await supabase.rpc('exec_sql', { sql: createSyncQuery })
    if (syncError) {
      console.error('❌ Error creating sync_status table:', syncError)
      return
    }
    console.log('✅ Sync_status table created')
    
    // Create indexes
    const indexQueries = [
      'CREATE INDEX idx_markets_status ON markets(status);',
      'CREATE INDEX idx_markets_category ON markets(category);',
      'CREATE INDEX idx_markets_created_at ON markets(createdAt);',
      'CREATE INDEX idx_market_events_market_id ON market_events(marketId);',
      'CREATE INDEX idx_market_events_event_type ON market_events(eventType);'
    ]
    
    console.log('\n📊 Creating indexes...')
    for (const query of indexQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.log(`⚠️  Index warning: ${error.message}`)
      } else {
        console.log('✅ Index created')
      }
    }
    
    // Enable RLS and create policies
    const rlsQueries = [
      'ALTER TABLE markets ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE market_events ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;',
      'CREATE POLICY "Allow public read access to markets" ON markets FOR SELECT USING (true);',
      'CREATE POLICY "Allow public read access to market_events" ON market_events FOR SELECT USING (true);',
      'CREATE POLICY "Allow public read access to sync_status" ON sync_status FOR SELECT USING (true);'
    ]
    
    console.log('\n🔒 Setting up RLS and policies...')
    for (const query of rlsQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.log(`⚠️  RLS warning: ${error.message}`)
      } else {
        console.log('✅ RLS/Policy set')
      }
    }
    
    console.log('\n🎉 Tables recreated successfully!')
    
    // Test the new structure
    console.log('\n🧪 Testing new table structure...')
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Test failed:', error)
    } else {
      console.log('✅ Table structure test passed!')
    }
    
  } catch (error) {
    console.error('❌ Recreation failed:', error)
  }
}

recreateTables()










