require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is not set in environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyDatabaseTables() {
  console.log('🔍 Verifying database tables...');

  try {
    // Check what tables exist by trying to query them
    const tablesToCheck = [
      'markets',
      'market_events', 
      'market_participants'
    ];

    console.log('\n📊 Checking existing tables:');
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1);

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: EXISTS (${count || 0} records)`);
          
          if (data && data.length > 0) {
            console.log(`   📋 Sample columns: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }

    // Try to get table schema information
    console.log('\n🔍 Attempting to get schema information...');
    
    try {
      // This might work to get table list
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (schemaError) {
        console.log('⚠️ Cannot access schema information directly');
      } else {
        console.log('📋 Available tables in public schema:');
        schemaData.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      }
    } catch (err) {
      console.log('⚠️ Cannot query schema information:', err.message);
    }

    // Test if we can create a simple table (this will fail but give us info)
    console.log('\n🧪 Testing table creation permissions...');
    
    try {
      const { data, error } = await supabase
        .from('test_table_creation')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST205') {
        console.log('✅ Can access Supabase, but test table does not exist (expected)');
      }
    } catch (err) {
      console.log('⚠️ Error testing table access:', err.message);
    }

  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  } finally {
    console.log('\n🎉 Database verification completed');
    console.log('\n📝 Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL from setup-participant-table.sql');
    console.log('4. Then run: node scripts/sync-with-participants.js');
  }
}

verifyDatabaseTables();

