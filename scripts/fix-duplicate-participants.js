const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    })
  }
}

loadEnvFile()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Found' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDuplicateParticipants() {
  console.log('🔍 Checking for duplicate participants...')
  
  try {
    // Get all participants
    const { data: participants, error } = await supabase
      .from('market_participants')
      .select('*')
      .order('marketid, address, createdat')

    if (error) {
      console.error('Error fetching participants:', error)
      return
    }

    // Group by market and address
    const grouped = {}
    participants.forEach(participant => {
      const key = `${participant.marketid}-${participant.address}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(participant)
    })

    // Find duplicates
    const duplicates = Object.entries(grouped).filter(([key, participants]) => participants.length > 1)
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate participants found')
      return
    }

    console.log(`🔍 Found ${duplicates.length} sets of duplicate participants`)

    for (const [key, duplicateParticipants] of duplicates) {
      const [marketId, address] = key.split('-')
      console.log(`\n🔄 Processing duplicates for market ${marketId}, address ${address}`)
      
      // Sort by creation date (keep the oldest)
      duplicateParticipants.sort((a, b) => new Date(a.createdat) - new Date(b.createdat))
      const [keep, ...toDelete] = duplicateParticipants
      
      console.log(`  Keeping participant ID: ${keep.id} (created: ${keep.createdat})`)
      console.log(`  Deleting ${toDelete.length} duplicates:`, toDelete.map(p => p.id))
      
      // Merge transaction hashes
      const allTransactionHashes = [
        ...(keep.transactionhashes || []),
        ...toDelete.flatMap(p => p.transactionhashes || [])
      ]
      
      // Calculate combined totals
      let totalYesShares = BigInt(keep.totalyesshares || '0')
      let totalNoShares = BigInt(keep.totalnoshares || '0')
      let totalInvestment = BigInt(keep.totalinvestment || '0')
      
      toDelete.forEach(participant => {
        totalYesShares += BigInt(participant.totalyesshares || '0')
        totalNoShares += BigInt(participant.totalnoshares || '0')
        totalInvestment += BigInt(participant.totalinvestment || '0')
      })
      
      // Update the kept participant with combined data
      const { error: updateError } = await supabase
        .from('market_participants')
        .update({
          totalyesshares: totalYesShares.toString(),
          totalnoshares: totalNoShares.toString(),
          totalinvestment: totalInvestment.toString(),
          transactionhashes: allTransactionHashes,
          lastpurchaseat: new Date().toISOString()
        })
        .eq('id', keep.id)
      
      if (updateError) {
        console.error(`❌ Error updating participant ${keep.id}:`, updateError)
        continue
      }
      
      // Delete the duplicate participants
      const deleteIds = toDelete.map(p => p.id)
      const { error: deleteError } = await supabase
        .from('market_participants')
        .delete()
        .in('id', deleteIds)
      
      if (deleteError) {
        console.error(`❌ Error deleting duplicates:`, deleteError)
        continue
      }
      
      console.log(`✅ Successfully merged and cleaned up duplicates for ${address}`)
    }
    
    console.log('\n✅ Duplicate participant cleanup completed!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

fixDuplicateParticipants()
