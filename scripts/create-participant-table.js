require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createParticipantTable() {
  console.log('🔧 Creating market_participants table...');

  try {
    // SQL to create the market_participants table
    const createTableSQL = `
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
    `;

    // Create the table using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('❌ Error creating table via RPC:', error);
      
      // Try alternative approach - create table through direct SQL execution
      console.log('🔄 Trying alternative approach...');
      
      // We'll use a different approach - insert a dummy record to trigger table creation
      // This is a workaround since we can't execute DDL directly
      console.log('⚠️ Cannot create table directly. Please create it manually in Supabase dashboard.');
      console.log('\n📋 SQL to run in Supabase SQL Editor:');
      console.log(createTableSQL);
      
      return;
    }

    console.log('✅ Table created successfully');

    // Verify the table exists
    const { data: participants, error: verifyError } = await supabase
      .from('market_participants')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.error('❌ Error verifying table:', verifyError);
    } else {
      console.log('✅ Table verified and accessible');
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Table creation process completed');
  }
}

createParticipantTable();

