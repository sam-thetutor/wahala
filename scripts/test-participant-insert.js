require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testParticipantInsert() {
  console.log('🧪 Testing participant insert with correct column names...');

  try {
    // Test data with correct column names
    const testData = {
      marketid: '1',
      address: '0x1234567890123456789012345678901234567890',
      totalyesshares: '1000000000000000000',
      totalnoshares: '0',
      totalinvestment: '1000000000000000000',
      firstpurchaseat: new Date().toISOString(),
      lastpurchaseat: new Date().toISOString(),
      transactionhashes: ['test-tx-hash']
    };

    console.log('📝 Inserting test participant...');
    const { data, error } = await supabase
      .from('market_participants')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Insert succeeded!');
      console.log('📊 Participant data:', {
        id: data.id,
        marketid: data.marketid,
        address: data.address,
        totalyesshares: data.totalyesshares,
        totalnoshares: data.totalnoshares,
        totalinvestment: data.totalinvestment
      });

      // Test updating the participant
      console.log('\n🔄 Testing participant update...');
      const updateData = {
        totalyesshares: '2000000000000000000',
        totalnoshares: '500000000000000000',
        totalinvestment: '2500000000000000000',
        lastpurchaseat: new Date().toISOString(),
        transactionhashes: ['test-tx-hash', 'test-tx-hash-2']
      };

      const { data: updatedData, error: updateError } = await supabase
        .from('market_participants')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Update failed:', updateError.message);
      } else {
        console.log('✅ Update succeeded!');
        console.log('📊 Updated participant data:', {
          totalyesshares: updatedData.totalyesshares,
          totalnoshares: updatedData.totalnoshares,
          totalinvestment: updatedData.totalinvestment,
          transactionhashes: updatedData.transactionhashes
        });
      }

      // Clean up test data
      console.log('\n🗑️ Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('market_participants')
        .delete()
        .eq('id', data.id);

      if (deleteError) {
        console.log('⚠️ Could not clean up test data:', deleteError.message);
      } else {
        console.log('✅ Test data cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Participant insert test completed');
  }
}

testParticipantInsert();
