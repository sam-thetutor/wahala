require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkParticipantTable() {
  console.log('🔍 Checking participant table...');

  try {
    // Try to fetch participants for a specific market
    const { data: participants, error } = await supabase
      .from('market_participants')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error accessing participant table:', error);
      console.log('This might mean the table does not exist or has wrong permissions');
      return;
    }

    console.log(`✅ Participant table exists and is accessible`);
    console.log(`📊 Found ${participants.length} participants in database`);
    
    if (participants.length > 0) {
      console.log('\n📋 Sample participants:');
      participants.forEach((participant, index) => {
        console.log(`${index + 1}. Market: ${participant.marketid} | Address: ${participant.address} | Yes: ${participant.totalyesshares} | No: ${participant.totalnoshares}`);
      });
    } else {
      console.log('📝 No participants found in database');
    }

    // Check if we can insert a test participant
    console.log('\n🧪 Testing participant insertion...');
    const testParticipant = {
      marketid: '1',
      address: '0x1234567890123456789012345678901234567890',
      totalyesshares: '1000000000000000000',
      totalnoshares: '0',
      totalinvestment: '1000000000000000000',
      firstpurchaseat: new Date().toISOString(),
      lastpurchaseat: new Date().toISOString(),
      transactionhashes: ['test-tx-hash']
    };

    const { data: inserted, error: insertError } = await supabase
      .from('market_participants')
      .insert(testParticipant)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test participant:', insertError);
    } else {
      console.log('✅ Test participant inserted successfully');
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('market_participants')
        .delete()
        .eq('id', inserted.id);
      
      if (deleteError) {
        console.warn('⚠️ Warning: Could not clean up test data:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Participant table check completed');
  }
}

checkParticipantTable();
