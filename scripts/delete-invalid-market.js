const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteInvalidMarket() {
  try {
    console.log('🔍 Looking for market with invalid endtime: 21:26')
    
    // Find and delete the market with invalid endtime
    const { data: market, error: fetchError } = await supabase
      .from('markets')
      .select('*')
      .eq('endtime', '21:26')
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.log('✅ Market not found - it may have already been deleted')
        return
      }
      throw fetchError
    }

    console.log('📋 Found invalid market:', {
      id: market.id,
      question: market.question,
      endtime: market.endtime
    })

    // Delete the market
    const { error: deleteError } = await supabase
      .from('markets')
      .delete()
      .eq('id', market.id)

    if (deleteError) {
      throw deleteError
    }

    console.log(`✅ Successfully deleted market with ID: ${market.id}`)

  } catch (error) {
    console.error('❌ Error deleting market:', error)
    process.exit(1)
  }
}

// Run the script
deleteInvalidMarket()
  .then(() => {
    console.log('🎉 Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
