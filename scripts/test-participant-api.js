require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testParticipantAPI() {
  console.log('🧪 Testing participant API functionality...');

  try {
    // Test the participant update API endpoint
    console.log('1️⃣ Testing participant update API...');
    
    const participantData = {
      marketId: '1',
      address: '0x1234567890123456789012345678901234567890',
      outcome: true, // Bought YES shares
      amount: '1.0', // 1 CELO
      transactionHash: 'test-tx-hash-' + Date.now()
    };

    const response = await fetch('http://localhost:3000/api/markets/update-participant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(participantData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Participant API test succeeded!');
      console.log('📊 Result:', result);
      
      // Clean up test data
      console.log('\n🗑️ Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('market_participants')
        .delete()
        .eq('marketid', '1')
        .eq('address', '0x1234567890123456789012345678901234567890');
      
      if (deleteError) {
        console.log('⚠️ Could not clean up test data:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up');
      }
    } else {
      const error = await response.text();
      console.log('❌ Participant API test failed:', error);
    }

    // Test fetching participants
    console.log('\n2️⃣ Testing participant fetch...');
    
    const { data: participants, error: fetchError } = await supabase
      .from('market_participants')
      .select('*')
      .eq('marketid', '1');

    if (fetchError) {
      console.log('❌ Fetch participants failed:', fetchError.message);
    } else {
      console.log('✅ Fetch participants succeeded!');
      console.log(`📊 Found ${participants.length} participants for market 1`);
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Participant API test completed');
  }
}

testParticipantAPI();

