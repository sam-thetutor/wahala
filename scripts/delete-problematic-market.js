const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteProblematicMarket() {
  try {
    console.log('🔍 Looking for market with ID: market_1757092061357')
    
    // First, let's check if the market exists
    const { data: market, error: fetchError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', 'market_1757092061357')
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.log('✅ Market not found - it may have already been deleted')
        return
      }
      throw fetchError
    }

    console.log('📋 Found market:', {
      id: market.id,
      question: market.question,
      createdat: market.createdat
    })

    // Delete the market
    const { error: deleteError } = await supabase
      .from('markets')
      .delete()
      .eq('id', 'market_1757092061357')

    if (deleteError) {
      throw deleteError
    }

    console.log('✅ Successfully deleted market: market_1757092061357')

    // Also check for any related events
    const { data: events, error: eventsError } = await supabase
      .from('market_events')
      .select('*')
      .eq('marketId', 'market_1757092061357')

    if (eventsError) {
      console.warn('⚠️ Error checking for related events:', eventsError.message)
    } else if (events && events.length > 0) {
      console.log(`📊 Found ${events.length} related events, deleting them...`)
      
      const { error: deleteEventsError } = await supabase
        .from('market_events')
        .delete()
        .eq('marketId', 'market_1757092061357')

      if (deleteEventsError) {
        console.warn('⚠️ Error deleting related events:', deleteEventsError.message)
      } else {
        console.log('✅ Successfully deleted related events')
      }
    } else {
      console.log('✅ No related events found')
    }

  } catch (error) {
    console.error('❌ Error deleting market:', error)
    process.exit(1)
  }
}

// Run the script
deleteProblematicMarket()
  .then(() => {
    console.log('🎉 Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
