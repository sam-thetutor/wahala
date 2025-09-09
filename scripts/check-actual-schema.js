const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkActualSchema() {
  try {
    console.log('🔍 Checking actual database schema...')
    
    // Try to get table information
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.log('❌ Could not get table list:', tablesError.message)
    } else {
      console.log('📋 Available tables:', tables?.map(t => t.table_name) || [])
    }
    
    // Try to get column information for markets table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'markets')
      .eq('table_schema', 'public')
    
    if (columnsError) {
      console.log('❌ Could not get column list:', columnsError.message)
    } else {
      console.log('📊 Markets table columns:')
      columns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`)
      })
    }
    
    // Try a simple insert to see what error we get
    console.log('\n🧪 Testing simple insert...')
    const testData = {
      id: 'test-123',
      question: 'Test question',
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
    
    const { data: insertData, error: insertError } = await supabase
      .from('markets')
      .insert(testData)
      .select()
    
    if (insertError) {
      console.log('❌ Insert error details:', JSON.stringify(insertError, null, 2))
    } else {
      console.log('✅ Insert successful!')
      console.log('📊 Inserted data:', insertData)
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error)
  }
}

checkActualSchema()







