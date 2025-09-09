require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyMarketIds() {
  console.log('🔍 Verifying market IDs after cleanup and sync...');

  try {
    const { data: markets, error } = await supabase
      .from('markets')
      .select('id, question, createdat')
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Error fetching markets:', error);
      return;
    }

    console.log(`📊 Total markets in database: ${markets.length}`);
    console.log('\n📋 Market IDs (should be sequential 1-N):');
    
    markets.forEach((market, index) => {
      const id = Number(market.id);
      const isSequential = id === index + 1;
      const status = isSequential ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ID: ${market.id} | Question: ${market.question.substring(0, 40)}...`);
    });

    // Check for any non-sequential or invalid IDs
    const invalidIds = markets.filter((market, index) => {
      const id = Number(market.id);
      return isNaN(id) || id !== index + 1 || id < 1;
    });

    if (invalidIds.length === 0) {
      console.log('\n🎉 All market IDs are correct and sequential!');
    } else {
      console.log(`\n⚠️ Found ${invalidIds.length} markets with invalid IDs:`);
      invalidIds.forEach(market => {
        console.log(`❌ ID: ${market.id} | Question: ${market.question.substring(0, 40)}...`);
      });
    }

    // Check ID range
    const ids = markets.map(m => Number(m.id));
    const minId = Math.min(...ids);
    const maxId = Math.max(...ids);
    console.log(`\n📈 ID range: ${minId} to ${maxId}`);
    console.log(`📊 Expected range: 1 to ${markets.length}`);

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Verification completed');
  }
}

verifyMarketIds();

