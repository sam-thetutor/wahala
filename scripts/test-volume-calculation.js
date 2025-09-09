#!/usr/bin/env node

/**
 * Test script to verify volume calculation is working correctly
 * 
 * This script tests the updated getMarketStats function to ensure
 * it's calculating total volume from trading events rather than pool sizes
 */

const { DatabaseService } = require('../lib/database');

async function testVolumeCalculation() {
  console.log('🔍 Testing volume calculation...\n');

  try {
    // Test the updated getMarketStats function
    console.log('📊 Fetching market stats...');
    const stats = await DatabaseService.getMarketStats();
    
    console.log('📈 Market Stats:');
    console.log(`   Total Markets: ${stats.totalMarkets}`);
    console.log(`   Active Markets: ${stats.activeMarkets}`);
    console.log(`   Resolved Markets: ${stats.resolvedMarkets}`);
    console.log(`   Total Volume: ${stats.totalVolume} wei`);
    console.log(`   Total Volume (CELO): ${(BigInt(stats.totalVolume) / BigInt(10**18)).toString()} CELO`);
    
    // Also check if we have any trading events
    console.log('\n🔍 Checking for trading events...');
    const { supabase } = require('../lib/supabase');
    
    const { data: tradingEvents, error: eventsError } = await supabase
      .from('market_events')
      .select('*')
      .eq('eventType', 'SharesBought')
      .limit(5);
    
    if (eventsError) {
      console.error('❌ Error fetching trading events:', eventsError);
    } else {
      console.log(`📊 Found ${tradingEvents?.length || 0} SharesBought events`);
      
      if (tradingEvents && tradingEvents.length > 0) {
        console.log('\n📋 Sample trading events:');
        tradingEvents.forEach((event, index) => {
          try {
            const args = typeof event.args === 'string' ? JSON.parse(event.args) : event.args;
            console.log(`   Event ${index + 1}:`);
            console.log(`     Market ID: ${args.marketId}`);
            console.log(`     Buyer: ${args.buyer}`);
            console.log(`     Amount: ${args.amount} wei (${(BigInt(args.amount) / BigInt(10**18)).toString()} CELO)`);
            console.log(`     Is Yes: ${args.isYes}`);
          } catch (parseError) {
            console.log(`   Event ${index + 1}: Error parsing args - ${parseError.message}`);
          }
        });
      }
    }
    
    // Check market participants as well
    console.log('\n👥 Checking market participants...');
    const { data: participants, error: participantsError } = await supabase
      .from('market_participants')
      .select('totalinvestment')
      .limit(5);
    
    if (participantsError) {
      console.error('❌ Error fetching participants:', participantsError);
    } else {
      console.log(`👥 Found ${participants?.length || 0} participants`);
      
      if (participants && participants.length > 0) {
        const totalFromParticipants = participants.reduce((sum, p) => {
          return sum + BigInt(p.totalinvestment || '0');
        }, 0n);
        
        console.log(`💰 Total investment from participants: ${totalFromParticipants.toString()} wei (${(totalFromParticipants / BigInt(10**18)).toString()} CELO)`);
      }
    }
    
    console.log('\n✅ Volume calculation test completed!');
    
  } catch (error) {
    console.error('❌ Error testing volume calculation:', error);
  }
}

// Run the test
testVolumeCalculation();
