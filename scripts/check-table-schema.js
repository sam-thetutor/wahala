require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableSchema() {
  console.log('🔍 Checking market_participants table schema...');

  try {
    // Try to get the table structure by attempting different column names
    console.log('\n📋 Testing different column name variations...');
    
    const columnTests = [
      'firstPurchaseAt',
      'first_purchase_at', 
      'firstpurchaseat',
      'first_purchaseAt',
      'created_at',
      'createdAt',
      'firstPurchase',
      'firstPurchaseTime'
    ];

    for (const column of columnTests) {
      try {
        const { data, error } = await supabase
          .from('market_participants')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${column}: ${error.message}`);
        } else {
          console.log(`✅ ${column}: EXISTS`);
        }
      } catch (err) {
        console.log(`❌ ${column}: ${err.message}`);
      }
    }

    // Try to get all columns by selecting *
    console.log('\n📊 Trying to get all columns...');
    try {
      const { data, error } = await supabase
        .from('market_participants')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Select * error: ${error.message}`);
      } else {
        console.log('✅ Select * works!');
        if (data && data.length > 0) {
          console.log('📋 Available columns:', Object.keys(data[0]).join(', '));
        } else {
          console.log('📝 Table is empty, but accessible');
        }
      }
    } catch (err) {
      console.log(`❌ Select * exception: ${err.message}`);
    }

    // Try to insert with different column names
    console.log('\n🧪 Testing insert with different column names...');
    
    const testRecords = [
      {
        marketId: 'test-1',
        address: '0x1234567890123456789012345678901234567890',
        totalYesShares: '1000000000000000000',
        totalNoShares: '0',
        totalInvestment: '1000000000000000000',
        firstPurchaseAt: new Date().toISOString(),
        lastPurchaseAt: new Date().toISOString(),
        transactionHashes: ['test-tx-hash']
      },
      {
        marketId: 'test-2',
        address: '0x1234567890123456789012345678901234567890',
        totalYesShares: '1000000000000000000',
        totalNoShares: '0',
        totalInvestment: '1000000000000000000',
        first_purchase_at: new Date().toISOString(),
        last_purchase_at: new Date().toISOString(),
        transactionHashes: ['test-tx-hash']
      },
      {
        marketId: 'test-3',
        address: '0x1234567890123456789012345678901234567890',
        totalYesShares: '1000000000000000000',
        totalNoShares: '0',
        totalInvestment: '1000000000000000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        transactionHashes: ['test-tx-hash']
      }
    ];

    for (let i = 0; i < testRecords.length; i++) {
      try {
        const { data, error } = await supabase
          .from('market_participants')
          .insert(testRecords[i])
          .select()
          .single();
        
        if (error) {
          console.log(`❌ Test record ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Test record ${i + 1}: SUCCESS!`);
          console.log(`   📝 Record ID: ${data.id}`);
          
          // Clean up
          await supabase
            .from('market_participants')
            .delete()
            .eq('id', data.id);
          
          console.log(`   🗑️ Test record ${i + 1} cleaned up`);
        }
      } catch (err) {
        console.log(`❌ Test record ${i + 1} exception: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Schema check completed');
  }
}

checkTableSchema();

