const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addMissingTransaction() {
  console.log('🔧 Add Missing Transaction Tool');
  console.log('This will help you add your recent buy shares transaction to the database.');
  console.log('');
  
  // You can modify these values based on your actual transaction
  const marketId = '26'; // Change this to the market you bought shares in
  const yourAddress = '0x21D654daaB0fe1be0e584980ca7C1a382850939f'; // Your wallet address
  const transactionHash = '0xYOUR_TRANSACTION_HASH_HERE'; // Replace with your actual transaction hash
  const amount = '0.1'; // Amount in CELO (e.g., '0.1' for 0.1 CELO)
  const outcome = true; // true for YES, false for NO
  
  console.log('📝 Transaction Details:');
  console.log(`Market ID: ${marketId}`);
  console.log(`Your Address: ${yourAddress}`);
  console.log(`Transaction Hash: ${transactionHash}`);
  console.log(`Amount: ${amount} CELO`);
  console.log(`Outcome: ${outcome ? 'YES' : 'NO'}`);
  console.log('');
  
  if (transactionHash === '0xYOUR_TRANSACTION_HASH_HERE') {
    console.log('❌ Please update the transactionHash in this script with your actual transaction hash.');
    console.log('You can find it in your wallet or on Celo Explorer.');
    return;
  }
  
  try {
    // Convert amount to wei
    const amountWei = (parseFloat(amount) * 1e18).toString();
    
    // Check if participant already exists
    const { data: existing, error: fetchError } = await supabase
      .from('market_participants')
      .select('*')
      .eq('marketid', marketId)
      .eq('address', yourAddress.toLowerCase())
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching existing participant:', fetchError);
      return;
    }
    
    if (existing) {
      console.log('📊 Existing participant found, updating...');
      
      // Update existing participant
      const existingHashes = existing.transactionhashes || [];
      const newTransactionHashes = [...existingHashes, transactionHash];
      
      let newYesShares = existing.totalyesshares;
      let newNoShares = existing.totalnoshares;
      let newTotalInvestment = (BigInt(existing.totalinvestment) + BigInt(amountWei)).toString();
      
      if (outcome) {
        // Bought YES shares
        newYesShares = (BigInt(existing.totalyesshares) + BigInt(amountWei)).toString();
      } else {
        // Bought NO shares
        newNoShares = (BigInt(existing.totalnoshares) + BigInt(amountWei)).toString();
      }
      
      const { data: updated, error: updateError } = await supabase
        .from('market_participants')
        .update({
          totalyesshares: newYesShares,
          totalnoshares: newNoShares,
          totalinvestment: newTotalInvestment,
          lastpurchaseat: new Date().toISOString(),
          transactionhashes: newTransactionHashes
        })
        .eq('id', existing.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('❌ Error updating participant:', updateError);
        return;
      }
      
      console.log('✅ Participant updated successfully!');
      console.log('Updated data:', {
        totalYesShares: updated.totalyesshares,
        totalNoShares: updated.totalnoshares,
        totalInvestment: updated.totalinvestment,
        transactionCount: updated.transactionhashes.length
      });
      
    } else {
      console.log('📊 No existing participant found, creating new one...');
      
      // Create new participant
      const { data: newParticipant, error: createError } = await supabase
        .from('market_participants')
        .insert({
          marketid: marketId,
          address: yourAddress.toLowerCase(),
          totalyesshares: outcome ? amountWei : '0',
          totalnoshares: outcome ? '0' : amountWei,
          totalinvestment: amountWei,
          firstpurchaseat: new Date().toISOString(),
          lastpurchaseat: new Date().toISOString(),
          transactionhashes: [transactionHash]
        })
        .select()
        .single();
        
      if (createError) {
        console.error('❌ Error creating participant:', createError);
        return;
      }
      
      console.log('✅ New participant created successfully!');
      console.log('Created data:', {
        totalYesShares: newParticipant.totalyesshares,
        totalNoShares: newParticipant.totalnoshares,
        totalInvestment: newParticipant.totalinvestment,
        transactionCount: newParticipant.transactionhashes.length
      });
    }
    
    // Verify the update
    console.log('\n✅ Final verification:');
    const { data: finalParticipants, error: finalError } = await supabase
      .from('market_participants')
      .select('*')
      .eq('marketid', marketId);
      
    if (finalError) {
      console.error('❌ Error fetching final participants:', finalError);
      return;
    }
    
    console.log(`Market ${marketId} now has ${finalParticipants.length} participants:`);
    finalParticipants.forEach((p, index) => {
      const investmentCELO = (Number(p.totalinvestment) / 1e18).toFixed(4);
      console.log(`${index + 1}. ${p.address} - ${investmentCELO} CELO - ${p.transactionhashes?.length || 0} transactions`);
    });
    
    console.log('\n🎉 Transaction added successfully! You should now see yourself in the Market Participants section.');
    
  } catch (error) {
    console.error('❌ Error adding transaction:', error);
  }
}

addMissingTransaction().catch(console.error);

