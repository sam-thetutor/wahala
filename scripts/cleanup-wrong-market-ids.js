require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanupWrongMarketIds() {
  console.log('🧹 Starting cleanup of markets with wrong IDs...');

  try {
    // First, let's see what markets we have
    const { data: allMarkets, error: fetchError } = await supabase
      .from('markets')
      .select('id, question, createdat')
      .order('createdat', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching markets:', fetchError);
      return;
    }

    console.log(`📊 Found ${allMarkets.length} markets in database:`);
    allMarkets.forEach((market, index) => {
      console.log(`${index + 1}. ID: ${market.id} | Question: ${market.question.substring(0, 50)}...`);
    });

    // Identify markets with wrong IDs
    const wrongIdMarkets = allMarkets.filter(market => {
      const id = market.id;
      // Check if ID is not a simple number (1, 2, 3, etc.)
      return isNaN(Number(id)) || id.includes('market_') || id.includes('_') || Number(id) > 1000;
    });

    console.log(`\n🔍 Found ${wrongIdMarkets.length} markets with wrong IDs:`);
    wrongIdMarkets.forEach((market, index) => {
      console.log(`${index + 1}. ID: ${market.id} | Question: ${market.question.substring(0, 50)}...`);
    });

    if (wrongIdMarkets.length === 0) {
      console.log('✅ No markets with wrong IDs found. Database is clean!');
      return;
    }

    // Delete markets with wrong IDs
    console.log('\n🗑️ Deleting markets with wrong IDs...');
    
    for (const market of wrongIdMarkets) {
      console.log(`Deleting market: ${market.id} - ${market.question.substring(0, 30)}...`);
      
      // Delete related participants first
      const { error: participantsError } = await supabase
        .from('market_participants')
        .delete()
        .eq('marketId', market.id);

      if (participantsError) {
        console.warn(`⚠️ Warning: Could not delete participants for market ${market.id}:`, participantsError.message);
      }

      // Delete related events
      const { error: eventsError } = await supabase
        .from('market_events')
        .delete()
        .eq('marketId', market.id);

      if (eventsError) {
        console.warn(`⚠️ Warning: Could not delete events for market ${market.id}:`, eventsError.message);
      }

      // Delete the market
      const { error: deleteError } = await supabase
        .from('markets')
        .delete()
        .eq('id', market.id);

      if (deleteError) {
        console.error(`❌ Error deleting market ${market.id}:`, deleteError);
      } else {
        console.log(`✅ Successfully deleted market ${market.id}`);
      }
    }

    console.log(`\n🎉 Cleanup completed! Deleted ${wrongIdMarkets.length} markets with wrong IDs.`);

    // Show remaining markets
    const { data: remainingMarkets, error: remainingError } = await supabase
      .from('markets')
      .select('id, question')
      .order('id', { ascending: true });

    if (remainingError) {
      console.error('❌ Error fetching remaining markets:', remainingError);
    } else {
      console.log(`\n📊 Remaining markets (${remainingMarkets.length}):`);
      remainingMarkets.forEach((market, index) => {
        console.log(`${index + 1}. ID: ${market.id} | Question: ${market.question.substring(0, 50)}...`);
      });
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Cleanup script completed');
  }
}

cleanupWrongMarketIds();

