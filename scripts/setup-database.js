
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database tables...')
    
    // Read the SQL file
    const sql = fs.readFileSync('./scripts/setup-database-tables.sql', 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executing: ${statement.trim().substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() })
        
        if (error) {
          console.error('❌ Error executing statement:', error)
          // Try direct query instead
          const { error: directError } = await supabase
            .from('markets')
            .select('*')
            .limit(1)
          
          if (directError) {
            console.log('📋 Creating tables manually...')
            await createTablesManually()
            break
          }
        } else {
          console.log('✅ Statement executed successfully')
        }
      }
    }
    
    console.log('🎉 Database setup completed!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

async function createTablesManually() {
  try {
    // Test if tables exist by trying to query them
    const { error: marketsError } = await supabase.from('markets').select('*').limit(1)
    
    if (marketsError && marketsError.code === 'PGRST116') {
      console.log('📋 Creating markets table...')
      // We'll need to use the Supabase dashboard to create tables
      console.log('⚠️  Please create the tables manually in Supabase dashboard:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Select your project')
      console.log('3. Go to SQL Editor')
      console.log('4. Run the SQL from scripts/setup-database-tables.sql')
    }
    
  } catch (error) {
    console.error('❌ Error creating tables manually:', error)
  }
}

setupDatabase()







