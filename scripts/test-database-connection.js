const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection error:', error)
      return
    }
    
    console.log('✅ Database connection successful!')
    console.log('📊 Sample data:', data)
    
    // Test inserting a simple record
    const testMarket = {
      id: 'test-1',
      question: 'Test market',
      endTime: '1234567890',
      totalPool: '1000000000000000000',
      totalYes: '500000000000000000',
      totalNo: '500000000000000000',
      status: 0,
      outcome: false,
      createdAt: '1234567890',
      creator: '0x0000000000000000000000000000000000000000',
      description: 'Test description',
      category: 'Test',
      image: '',
      source: ''
    }
    
    console.log('🧪 Testing market insertion...')
    const { data: insertData, error: insertError } = await supabase
      .from('markets')
      .insert(testMarket)
      .select()
    
    if (insertError) {
      console.error('❌ Insert error:', insertError)
    } else {
      console.log('✅ Test market inserted successfully!')
      console.log('📊 Inserted data:', insertData)
      
      // Clean up test data
      await supabase
        .from('markets')
        .delete()
        .eq('id', 'test-1')
      
      console.log('🧹 Test data cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDatabaseConnection()










