const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structure...')
    
    // Try to get table info by querying with different column names
    const columns = [
      'id', 'question', 'endTime', 'totalPool', 'totalYes', 'totalNo', 
      'status', 'outcome', 'createdAt', 'creator', 'description', 
      'category', 'image', 'source', 'updatedAt'
    ]
    
    console.log('📋 Testing each column...')
    
    for (const column of columns) {
      try {
        const { data, error } = await supabase
          .from('markets')
          .select(column)
          .limit(1)
        
        if (error) {
          console.log(`❌ Column '${column}': ${error.message}`)
        } else {
          console.log(`✅ Column '${column}': exists`)
        }
      } catch (err) {
        console.log(`❌ Column '${column}': ${err.message}`)
      }
    }
    
    // Try to get all columns
    console.log('\n🔍 Trying to get all columns...')
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Error getting all columns:', error.message)
    } else {
      console.log('✅ All columns query successful')
      console.log('📊 Available columns:', Object.keys(data[0] || {}))
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

checkTableStructure()










