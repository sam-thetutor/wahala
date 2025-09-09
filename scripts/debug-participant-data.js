require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugParticipantData() {
  console.log('🔍 Debugging participant data...');

  try {
    // Get raw participant data
    const { data: participants, error } = await supabase
      .from('market_participants')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching participants:', error);
      return;
    }

    console.log('📊 Raw participant data:');
    participants.forEach((participant, index) => {
      console.log(`\n${index + 1}. Participant ${participant.id}:`);
      console.log(`   Market ID: ${participant.marketid}`);
      console.log(`   Address: ${participant.address}`);
      console.log(`   Total Yes Shares (raw): ${participant.totalyesshares}`);
      console.log(`   Total No Shares (raw): ${participant.totalnoshares}`);
      console.log(`   Total Investment (raw): ${participant.totalinvestment}`);
      console.log(`   First Purchase: ${participant.firstpurchaseat}`);
      console.log(`   Last Purchase: ${participant.lastpurchaseat}`);
      console.log(`   Transaction Hashes: ${JSON.stringify(participant.transactionhashes)}`);
      
      // Convert to readable format
      const yesShares = BigInt(participant.totalyesshares);
      const noShares = BigInt(participant.totalnoshares);
      const investment = BigInt(participant.totalinvestment);
      
      console.log(`   Yes Shares (wei): ${yesShares.toString()}`);
      console.log(`   No Shares (wei): ${noShares.toString()}`);
      console.log(`   Investment (wei): ${investment.toString()}`);
      
      // Convert to CELO (divide by 10^18)
      const yesSharesCELO = yesShares / BigInt(10**18);
      const noSharesCELO = noShares / BigInt(10**18);
      const investmentCELO = investment / BigInt(10**18);
      
      console.log(`   Yes Shares (CELO): ${yesSharesCELO.toString()}`);
      console.log(`   No Shares (CELO): ${noSharesCELO.toString()}`);
      console.log(`   Investment (CELO): ${investmentCELO.toString()}`);
    });

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Debug completed');
  }
}

debugParticipantData();

