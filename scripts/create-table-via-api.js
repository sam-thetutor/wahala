require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTableViaAPI() {
  console.log('🔧 Attempting to create table via API...');

  try {
    // Try to create the table using a stored procedure or function
    // This is a workaround since we can't execute DDL directly
    
    console.log('1️⃣ Trying to create table using RPC...');
    
    // First, let's try to create a simple test table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS test_table_creation (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
    `;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (error) {
        console.log('❌ RPC exec_sql not available:', error.message);
      } else {
        console.log('✅ RPC exec_sql worked!');
      }
    } catch (err) {
      console.log('❌ RPC exec_sql failed:', err.message);
    }

    // Try alternative approach - create a view first
    console.log('\n2️⃣ Trying to create a view...');
    
    try {
      const { data, error } = await supabase
        .from('test_view_creation')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST205') {
        console.log('✅ Can access Supabase, but test view does not exist (expected)');
      }
    } catch (err) {
      console.log('❌ View test failed:', err.message);
    }

    // Try to create the table by inserting data (this might work if table exists)
    console.log('\n3️⃣ Trying to create table by inserting data...');
    
    try {
      // This approach tries to create the table by inserting data
      // If the table doesn't exist, this will fail
      const testData = {
        marketId: '1',
        address: '0x1234567890123456789012345678901234567890',
        totalYesShares: '1000000000000000000',
        totalNoShares: '0',
        totalInvestment: '1000000000000000000',
        firstPurchaseAt: new Date().toISOString(),
        lastPurchaseAt: new Date().toISOString(),
        transactionHashes: ['test-tx-hash']
      };

      const { data, error } = await supabase
        .from('market_participants')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.log('❌ Insert failed (table likely doesn\'t exist):', error.message);
      } else {
        console.log('✅ Insert succeeded! Table exists and is accessible');
        
        // Clean up
        await supabase
          .from('market_participants')
          .delete()
          .eq('id', data.id);
        
        console.log('✅ Test data cleaned up');
      }
    } catch (err) {
      console.log('❌ Insert exception:', err.message);
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 API table creation attempt completed');
    console.log('\n📝 Manual Steps Required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Make sure you\'re in the correct project');
    console.log('3. Run this SQL:');
    console.log(`
CREATE TABLE IF NOT EXISTS market_participants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  marketId TEXT NOT NULL,
  address TEXT NOT NULL,
  totalYesShares TEXT NOT NULL DEFAULT '0',
  totalNoShares TEXT NOT NULL DEFAULT '0',
  totalInvestment TEXT NOT NULL DEFAULT '0',
  firstPurchaseAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  lastPurchaseAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  transactionHashes TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE(marketId, address)
);

CREATE INDEX IF NOT EXISTS idx_market_participants_market_id ON market_participants(marketId);
CREATE INDEX IF NOT EXISTS idx_market_participants_address ON market_participants(address);
    `);
    console.log('4. Click "Run" and check for any error messages');
    console.log('5. Then run: node scripts/sync-with-participants.js');
  }
}

createTableViaAPI();

