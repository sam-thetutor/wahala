require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugTableCreation() {
  console.log('🔍 Debugging table creation...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Using anon key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

  try {
    // Try different approaches to check if table exists
    
    // Approach 1: Try to select from the table
    console.log('\n1️⃣ Trying direct SELECT from market_participants...');
    try {
      const { data, error } = await supabase
        .from('market_participants')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
        console.log(`   Details: ${error.details}`);
        console.log(`   Hint: ${error.hint}`);
      } else {
        console.log('✅ Table exists and is accessible!');
        console.log(`📊 Found ${data.length} records`);
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }

    // Approach 2: Try to insert a test record (this might create the table)
    console.log('\n2️⃣ Trying to insert a test record...');
    try {
      const testRecord = {
        marketId: 'test-market-123',
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
        .insert(testRecord)
        .select()
        .single();

      if (error) {
        console.log(`❌ Insert error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      } else {
        console.log('✅ Successfully inserted test record!');
        console.log(`📝 Record ID: ${data.id}`);
        
        // Clean up test record
        const { error: deleteError } = await supabase
          .from('market_participants')
          .delete()
          .eq('id', data.id);
        
        if (deleteError) {
          console.log(`⚠️ Could not clean up test record: ${deleteError.message}`);
        } else {
          console.log('✅ Test record cleaned up');
        }
      }
    } catch (err) {
      console.log(`❌ Insert exception: ${err.message}`);
    }

    // Approach 3: Check if we can access other tables to verify connection
    console.log('\n3️⃣ Verifying connection with existing tables...');
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ Markets table error: ${error.message}`);
      } else {
        console.log('✅ Successfully connected to markets table');
        console.log(`📊 Sample market ID: ${data[0]?.id || 'No data'}`);
      }
    } catch (err) {
      console.log(`❌ Markets table exception: ${err.message}`);
    }

    // Approach 4: Try different table name variations
    console.log('\n4️⃣ Trying different table name variations...');
    const variations = ['market_participants', 'MarketParticipants', 'marketparticipants'];
    
    for (const tableName of variations) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: EXISTS!`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Debug completed');
    console.log('\n💡 If the table still doesn\'t exist:');
    console.log('1. Double-check you ran the SQL in the correct Supabase project');
    console.log('2. Make sure you clicked "Run" after pasting the SQL');
    console.log('3. Check if there were any error messages in the SQL Editor');
    console.log('4. Try refreshing the Supabase dashboard');
  }
}

debugTableCreation();

