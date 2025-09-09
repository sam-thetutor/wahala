require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getActualColumns() {
  console.log('🔍 Getting actual column names from market_participants table...');

  try {
    // Try to insert a minimal record to see what columns are expected
    console.log('🧪 Testing minimal insert...');
    
    const minimalData = {
      marketid: '1',
      address: '0x1234567890123456789012345678901234567890',
      totalyesshares: '1000000000000000000',
      totalnoshares: '0',
      totalinvestment: '1000000000000000000',
      firstpurchaseat: new Date().toISOString(),
      lastpurchaseat: new Date().toISOString(),
      transactionhashes: ['test-tx-hash']
    };

    const { data, error } = await supabase
      .from('market_participants')
      .insert(minimalData)
      .select()
      .single();

    if (error) {
      console.log('❌ Minimal insert failed:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Minimal insert succeeded!');
      console.log('📊 Actual columns in response:', Object.keys(data));
      
      // Clean up
      await supabase
        .from('market_participants')
        .delete()
        .eq('id', data.id);
      
      console.log('✅ Test data cleaned up');
    }

    // Try different variations of column names
    console.log('\n🔍 Testing different column name variations...');
    
    const columnVariations = {
      marketId: ['marketid', 'market_id', 'marketId', 'MarketId'],
      address: ['address', 'Address', 'user_address', 'useraddress'],
      totalYesShares: ['totalyesshares', 'total_yes_shares', 'totalYesShares', 'total_yes_shares'],
      totalNoShares: ['totalnoshares', 'total_no_shares', 'totalNoShares', 'total_no_shares'],
      totalInvestment: ['totalinvestment', 'total_investment', 'totalInvestment', 'total_investment'],
      firstPurchaseAt: ['firstpurchaseat', 'first_purchase_at', 'firstPurchaseAt', 'created_at'],
      lastPurchaseAt: ['lastpurchaseat', 'last_purchase_at', 'lastPurchaseAt', 'updated_at'],
      transactionHashes: ['transactionhashes', 'transaction_hashes', 'transactionHashes', 'tx_hashes']
    };

    for (const [field, variations] of Object.entries(columnVariations)) {
      console.log(`\n📋 Testing ${field} variations:`);
      
      for (const variation of variations) {
        try {
          const testData = { [variation]: 'test-value' };
          const { data, error } = await supabase
            .from('market_participants')
            .select(variation)
            .limit(1);
          
          if (error) {
            console.log(`  ❌ ${variation}: ${error.message}`);
          } else {
            console.log(`  ✅ ${variation}: EXISTS`);
          }
        } catch (err) {
          console.log(`  ❌ ${variation}: ${err.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Column name detection completed');
  }
}

getActualColumns();

