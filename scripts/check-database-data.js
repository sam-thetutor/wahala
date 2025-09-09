const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseData() {
  try {
    console.log('🔍 Checking all markets in database...')
    
    const { data: markets, error } = await supabase
      .from('markets')
      .select('*')
      .order('createdat', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    console.log(`📊 Found ${markets.length} markets:`)
    
    markets.forEach((market, index) => {
      console.log(`\n${index + 1}. Market ID: ${market.id}`)
      console.log(`   Question: ${market.question}`)
      console.log(`   End Time: ${market.endtime} (type: ${typeof market.endtime})`)
      console.log(`   Total Pool: ${market.totalpool} (type: ${typeof market.totalpool})`)
      console.log(`   Created At: ${market.createdat} (type: ${typeof market.createdat})`)
      
      // Check if any field contains invalid data
      const invalidFields = []
      if (market.endtime && isNaN(Number(market.endtime))) {
        invalidFields.push(`endtime: "${market.endtime}"`)
      }
      if (market.totalpool && isNaN(Number(market.totalpool))) {
        invalidFields.push(`totalpool: "${market.totalpool}"`)
      }
      if (market.createdat && isNaN(Number(market.createdat))) {
        invalidFields.push(`createdat: "${market.createdat}"`)
      }
      
      if (invalidFields.length > 0) {
        console.log(`   ⚠️  Invalid fields: ${invalidFields.join(', ')}`)
      }
    })

  } catch (error) {
    console.error('❌ Error checking database:', error)
    process.exit(1)
  }
}

// Run the script
checkDatabaseData()
  .then(() => {
    console.log('\n🎉 Database check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
