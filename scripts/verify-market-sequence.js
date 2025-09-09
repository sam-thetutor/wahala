require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyMarketSequence() {
  console.log('🔍 Verifying market ID sequence...');

  try {
    const { data: markets, error } = await supabase
      .from('markets')
      .select('id, question')
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Error fetching markets:', error);
      return;
    }

    console.log(`📊 Total markets in database: ${markets.length}`);
    
    // Extract and sort IDs
    const ids = markets.map(m => Number(m.id)).sort((a, b) => a - b);
    const minId = Math.min(...ids);
    const maxId = Math.max(...ids);
    
    console.log(`📈 ID range: ${minId} to ${maxId}`);
    
    // Check for missing IDs in sequence
    const missingIds = [];
    for (let i = minId; i <= maxId; i++) {
      if (!ids.includes(i)) {
        missingIds.push(i);
      }
    }
    
    if (missingIds.length === 0) {
      console.log('✅ All market IDs are present in sequence!');
    } else {
      console.log(`❌ Missing IDs in sequence: ${missingIds.join(', ')}`);
    }
    
    // Check for invalid IDs (non-numeric, duplicates, etc.)
    const invalidIds = [];
    const seenIds = new Set();
    
    markets.forEach(market => {
      const id = market.id;
      const numId = Number(id);
      
      if (isNaN(numId)) {
        invalidIds.push({ id, reason: 'Non-numeric' });
      } else if (seenIds.has(numId)) {
        invalidIds.push({ id, reason: 'Duplicate' });
      } else if (numId < 1) {
        invalidIds.push({ id, reason: 'Less than 1' });
      } else {
        seenIds.add(numId);
      }
    });
    
    if (invalidIds.length === 0) {
      console.log('✅ All market IDs are valid!');
    } else {
      console.log(`❌ Found ${invalidIds.length} invalid IDs:`);
      invalidIds.forEach(item => {
        console.log(`  - ID: ${item.id} (${item.reason})`);
      });
    }
    
    // Show first few and last few markets
    console.log('\n📋 First 5 markets:');
    markets.slice(0, 5).forEach((market, index) => {
      console.log(`  ${index + 1}. ID: ${market.id} | ${market.question.substring(0, 40)}...`);
    });
    
    console.log('\n📋 Last 5 markets:');
    markets.slice(-5).forEach((market, index) => {
      console.log(`  ${markets.length - 4 + index}. ID: ${market.id} | ${market.question.substring(0, 40)}...`);
    });
    
    // Overall status
    const hasValidSequence = missingIds.length === 0 && invalidIds.length === 0;
    console.log(`\n${hasValidSequence ? '🎉' : '⚠️'} Overall status: ${hasValidSequence ? 'All good!' : 'Issues found'}`);

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Verification completed');
  }
}

verifyMarketSequence();

